import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: { status: 'LOCKED' },
      include: {
        user: { select: { name: true, email: true, department: true } },
        cycle: true,
        achievements: true,
      },
      orderBy: [{ user: { name: 'asc' } }, { createdAt: 'asc' }],
    });

    const rows = goals.flatMap(goal => {
      if (goal.achievements.length === 0) {
        return [{
          employeeName: goal.user.name,
          email: goal.user.email,
          department: goal.user.department,
          cycle: goal.cycle.name,
          thrustArea: goal.thrustArea,
          goalTitle: goal.title,
          uomType: goal.uomType,
          target: goal.target,
          weightage: goal.weightage,
          quarter: '-',
          actualAchievement: '-',
          status: '-',
          score: 0,
        }];
      }

      return goal.achievements.map(a => ({
        employeeName: goal.user.name,
        email: goal.user.email,
        department: goal.user.department,
        cycle: goal.cycle.name,
        thrustArea: goal.thrustArea,
        goalTitle: goal.title,
        uomType: goal.uomType,
        target: goal.target,
        weightage: goal.weightage,
        quarter: a.quarter,
        actualAchievement: a.actualAchievement,
        status: a.progressStatus,
        score: a.score,
      }));
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
