import { db } from '@/db';
import { agent, meeting } from '@/db/schema';
import { streamVideo } from '@/lib/stream-video';
import {
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent
} from '@stream-io/node-sdk';
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
  }

  return NextResponse.json({ status: 'ok' });
}
