import { db } from '@/db';
import { agent, meeting } from '@/db/schema';
import { inngest } from '@/inngest/client';
import { streamVideo } from '@/lib/stream-video';
import {
  CallEndedEvent,
  CallRecordingReadyEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallTranscriptionReadyEvent
} from '@stream-io/node-sdk';
import {} from '@stream-io/video-react-sdk';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const verifySignWithSDK = (body: string, sign: string): boolean => {
  return streamVideo.verifyWebhook(body, sign);
};

export async function POST(req: NextRequest) {
  const sign = req.headers.get('x-signature');
  const apiKey = req.headers.get('x-api-key');

  if (!sign || !apiKey) {
    return NextResponse.json(
      { error: 'Missing sign or API key' },
      { status: 400 }
    );
  }

  const body = await req.text();

  if (!verifySignWithSDK(body, sign)) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = (payload as Record<string, unknown>)?.type;

  if (eventType === 'call.session_started') {
    const event = payload as CallSessionStartedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
    }

    const [existingMeeting] = await db
      .select()
      .from(meeting)
      .where(and(eq(meeting.id, meetingId), eq(meeting.status, 'upcoming')));

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    await db
      .update(meeting)
      .set({ status: 'active', startedAt: new Date() })
      .where(eq(meeting.id, existingMeeting.id));

    const [existingAgent] = await db
      .select()
      .from(agent)
      .where(eq(agent.id, existingMeeting.agentId));

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const call = streamVideo.video.call('default', meetingId);

    const realtimeClient = await streamVideo.video.connectOpenAi({
      call,
      openAiApiKey: process.env.OPENAI_API_KEY as string,
      agentUserId: existingAgent.id
    });

    realtimeClient.updateSession({
      instructions: existingAgent.instructions
    });
  } else if (eventType === 'call.session_participant_left') {
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = event.call_cid.split(':')[1]; // call_cid is formatted as "type:id"

    if (!meetingId) {
      return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
    }

    const call = streamVideo.video.call('default', meetingId);
    call.end();
  } else if (eventType === 'call.session_ended') {
    const event = payload as CallEndedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
    }

    await db
      .update(meeting)
      .set({ status: 'processing' })
      .where(and(eq(meeting.id, meetingId), eq(meeting.status, 'active')));
  } else if (eventType === 'call.transcription_ready') {
    const event = payload as CallTranscriptionReadyEvent;
    const meetingId = event.call_cid.split(':')[1]; // call_cid is formatted as "type:id"

    const [updatedMeeting] = await db
      .update(meeting)
      .set({ transcriptUrl: event.call_transcription.url })
      .where(eq(meeting.id, meetingId))
      .returning();

    if (!updatedMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    await inngest.send({
      name: 'meetings/processing',
      data: {
        meetingId: updatedMeeting.id,
        transcriptUrl: updatedMeeting.transcriptUrl
      }
    });
  } else if (eventType === 'call.recording_ready') {
    const event = payload as CallRecordingReadyEvent;
    const meetingId = event.call_cid.split(':')[1]; // call_cid is formatted as "type:id"

    await db
      .update(meeting)
      .set({ recordingUrl: event.call_recording.url })
      .where(eq(meeting.id, meetingId));
  }

  return NextResponse.json({ status: 'ok' });
}
