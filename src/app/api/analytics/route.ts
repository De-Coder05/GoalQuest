import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/analytics - get analytics data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Goal status distribution
    const goals = await prisma.goal.findMany({
      include: {
        user: { select: { name: true, department: true } },
        achievements: true,
        checkIns: true,
      },
    });

    const statusDistribution = {
      DRAFT: goals.filter(g => g.status === 'DRAFT').length,
      SUBMITTED: goals.filter(g => g.status === 'SUBMITTED').length,
      APPROVED: goals.filter(g => g.status === 'APPROVED').length,
      LOCKED: goals.filter(g => g.status === 'LOCKED').length,
      RETURNED: goals.filter(g => g.status === 'RETURNED').length,
    };

    // Thrust area distribution
    const thrustAreas: Record<string, number> = {};
    goals.forEach(g => {
      thrustAreas[g.thrustArea] = (thrustAreas[g.thrustArea] || 0) + 1;
    });

    // UoM distribution
    const uomDistribution: Record<string, number> = {};
    goals.forEach(g => {
      uomDistribution[g.uomType] = (uomDistribution[g.uomType] || 0) + 1;
    });

    // Department-wise completion
    const departments: Record<string, { total: number; locked: number; withAchievements: number }> = {};
    goals.forEach(g => {
      const dept = g.user.department;
      if (!departments[dept]) {
        departments[dept] = { total: 0, locked: 0, withAchievements: 0 };
      }
      departments[dept].total++;
      if (g.status === 'LOCKED') departments[dept].locked++;
      if (g.achievements.length > 0) departments[dept].withAchievements++;
    });

    // Quarter-wise achievement scores
    const quarterScores: Record<string, { total: number; count: number }> = {};
    goals.forEach(g => {
      g.achievements.forEach(a => {
        if (!quarterScores[a.quarter]) {
          quarterScores[a.quarter] = { total: 0, count: 0 };
        }
        quarterScores[a.quarter].total += a.score;
        quarterScores[a.quarter].count++;
      });
    });

    const qoqTrends = Object.entries(quarterScores).map(([quarter, data]) => ({
      quarter,
      avgScore: data.count > 0 ? Math.round(data.total / data.count) : 0,
      goalsTracked: data.count,
    }));

    // Check-in completion rates by manager
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      include: {
        employees: {
          include: {
            goals: {
              where: { status: 'LOCKED' },
              include: { checkIns: true },
            },
          },
        },
      },
    });

    const managerEffectiveness = managers.map(m => {
      const totalGoals = m.employees.reduce((sum, e) => sum + e.goals.length, 0);
      const checkedInGoals = m.employees.reduce(
        (sum, e) => sum + e.goals.filter(g => g.checkIns.length > 0).length,
        0
      );
      return {
        name: m.name,
        department: m.department,
        teamSize: m.employees.length,
        totalGoals,
        checkedInGoals,
        completionRate: totalGoals > 0 ? Math.round((checkedInGoals / totalGoals) * 100) : 0,
      };
    });

    // Total users
    const totalUsers = await prisma.user.count();
    const totalGoals = goals.length;
    const lockedGoals = goals.filter(g => g.status === 'LOCKED').length;

    return NextResponse.json({
      summary: {
        totalUsers,
        totalGoals,
        lockedGoals,
        completionRate: totalGoals > 0 ? Math.round((lockedGoals / totalGoals) * 100) : 0,
      },
      statusDistribution,
      thrustAreas,
      uomDistribution,
      departments,
      qoqTrends,
      managerEffectiveness,
    });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
