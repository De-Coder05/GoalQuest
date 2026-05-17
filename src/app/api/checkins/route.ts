import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only managers can perform check-ins' }, { status: 403 });
    }

    const body = await req.json();
    const { goalId, quarter, comment } = body;

    if (!goalId || !quarter) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const checkIn = await prisma.checkIn.upsert({
      where: { goalId_quarter: { goalId, quarter } },
      create: {
        goalId,
        quarter,
        managerId: user.id,
        comment: comment || '',
      },
      update: {
        comment: comment || '',
        managerId: user.id,
      },
      include: {
        manager: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        goalId,
        userId: user.id,
        action: 'CHECKIN',
        field: `${quarter}_checkin`,
        newValue: comment || 'Check-in completed',
      },
    });

    return NextResponse.json(checkIn);
  } catch (error) {
    console.error('POST /api/checkins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get('goalId');
    const quarter = searchParams.get('quarter');

    let where: any = {};
    if (goalId) where.goalId = goalId;
    if (quarter) where.quarter = quarter;

    const checkIns = await prisma.checkIn.findMany({
      where,
      include: {
        manager: { select: { name: true } },
        goal: {
          include: {
            user: { select: { name: true, department: true } },
            achievements: true,
          },
        },
      },
      orderBy: { checkedAt: 'desc' },
    });

    return NextResponse.json(checkIns);
  } catch (error) {
    console.error('GET /api/checkins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
