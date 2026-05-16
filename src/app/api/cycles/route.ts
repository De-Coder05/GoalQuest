import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/cycles - get goal cycles
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cycles = await prisma.goalCycle.findMany({
      orderBy: { year: 'desc' },
    });

    return NextResponse.json(cycles);
  } catch (error) {
    console.error('GET /api/cycles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/cycles - create a new cycle (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can create cycles' }, { status: 403 });
    }

    const body = await req.json();
    const { name, year, startDate, endDate } = body;

    const cycle = await prisma.goalCycle.create({
      data: {
        name,
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    console.error('POST /api/cycles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
