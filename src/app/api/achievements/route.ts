import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function computeScore(uomType: string, target: string, actual: string): number {
  if (!actual || actual === '') return 0;

  switch (uomType) {
    case 'MIN_NUMERIC':
    case 'MIN_PERCENT': {
      const t = parseFloat(target);
      const a = parseFloat(actual);
      if (t === 0) return a > 0 ? 100 : 0;
      return Math.min(Math.round((a / t) * 100), 100);
    }
    case 'MAX_NUMERIC':
    case 'MAX_PERCENT': {
      const t = parseFloat(target);
      const a = parseFloat(actual);
      if (a === 0) return 100;
      return Math.min(Math.round((t / a) * 100), 100);
    }
    case 'TIMELINE': {
      const deadline = new Date(target);
      const completion = new Date(actual);
      if (completion <= deadline) return 100;
      // Deduct points for lateness (10% per week late)
      const daysLate = Math.ceil((completion.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, 100 - Math.ceil(daysLate / 7) * 10);
    }
    case 'ZERO': {
      const a = parseFloat(actual);
      return a === 0 ? 100 : 0;
    }
    default:
      return 0;
  }
}

// POST /api/achievements - log or update achievement
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const { goalId, quarter, actualAchievement, progressStatus } = body;

    if (!goalId || !quarter) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify goal exists and belongs to user
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (goal.status !== 'LOCKED') {
      return NextResponse.json({ error: 'Can only log achievements for locked goals' }, { status: 400 });
    }

    // Compute score
    const score = computeScore(goal.uomType, goal.target, actualAchievement);

    const achievement = await prisma.achievement.upsert({
      where: { goalId_quarter: { goalId, quarter } },
      create: {
        goalId,
        quarter,
        actualAchievement: String(actualAchievement),
        progressStatus: progressStatus || 'ON_TRACK',
        score,
      },
      update: {
        actualAchievement: String(actualAchievement),
        progressStatus: progressStatus || 'ON_TRACK',
        score,
      },
    });

    // If this is a shared goal (primary owner), sync to copies
    if (!goal.sharedFromId) {
      const copies = await prisma.goal.findMany({
        where: { sharedFromId: goalId },
      });
      for (const copy of copies) {
        await prisma.achievement.upsert({
          where: { goalId_quarter: { goalId: copy.id, quarter } },
          create: {
            goalId: copy.id,
            quarter,
            actualAchievement: String(actualAchievement),
            progressStatus: progressStatus || 'ON_TRACK',
            score,
          },
          update: {
            actualAchievement: String(actualAchievement),
            score,
          },
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        goalId,
        userId: user.id,
        action: 'ACHIEVEMENT_UPDATED',
        field: `${quarter}_achievement`,
        newValue: String(actualAchievement),
      },
    });

    return NextResponse.json(achievement);
  } catch (error) {
    console.error('POST /api/achievements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
