import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalCycle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.escalationRule.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@atomberg.com',
      password: hashedPassword,
      name: 'Priya Sharma',
      role: 'ADMIN',
      department: 'Human Resources',
    },
  });

  // Create Manager
  const manager = await prisma.user.create({
    data: {
      email: 'manager@atomberg.com',
      password: hashedPassword,
      name: 'Rahul Verma',
      role: 'MANAGER',
      department: 'Engineering',
    },
  });

  // Create Manager 2
  const manager2 = await prisma.user.create({
    data: {
      email: 'manager2@atomberg.com',
      password: hashedPassword,
      name: 'Anita Desai',
      role: 'MANAGER',
      department: 'Marketing',
    },
  });

  // Create Employees
  const emp1 = await prisma.user.create({
    data: {
      email: 'employee@atomberg.com',
      password: hashedPassword,
      name: 'Arjun Patel',
      role: 'EMPLOYEE',
      department: 'Engineering',
      managerId: manager.id,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      email: 'employee2@atomberg.com',
      password: hashedPassword,
      name: 'Sneha Iyer',
      role: 'EMPLOYEE',
      department: 'Engineering',
      managerId: manager.id,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      email: 'employee3@atomberg.com',
      password: hashedPassword,
      name: 'Vikram Singh',
      role: 'EMPLOYEE',
      department: 'Marketing',
      managerId: manager2.id,
    },
  });

  // Create Goal Cycle
  const cycle = await prisma.goalCycle.create({
    data: {
      name: 'FY 2026-27',
      year: 2026,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2027-04-30'),
      status: 'ACTIVE',
    },
  });

  // Create sample goals for employee 1 (approved/locked)
  const goals = [
    {
      userId: emp1.id,
      cycleId: cycle.id,
      thrustArea: 'Product Development',
      title: 'Deliver IoT Dashboard v2.0',
      description: 'Complete the next-gen IoT monitoring dashboard with real-time analytics capabilities',
      uomType: 'TIMELINE',
      target: '2026-09-30',
      weightage: 30,
      status: 'LOCKED',
    },
    {
      userId: emp1.id,
      cycleId: cycle.id,
      thrustArea: 'Quality',
      title: 'Reduce Bug Escape Rate',
      description: 'Decrease production bugs per release cycle through improved testing',
      uomType: 'MAX_NUMERIC',
      target: '5',
      weightage: 20,
      status: 'LOCKED',
    },
    {
      userId: emp1.id,
      cycleId: cycle.id,
      thrustArea: 'Innovation',
      title: 'File Patent Applications',
      description: 'Submit at least 2 patent applications for novel smart home algorithms',
      uomType: 'MIN_NUMERIC',
      target: '2',
      weightage: 15,
      status: 'LOCKED',
    },
    {
      userId: emp1.id,
      cycleId: cycle.id,
      thrustArea: 'Efficiency',
      title: 'Improve Code Coverage',
      description: 'Increase unit test coverage across all microservices',
      uomType: 'MIN_PERCENT',
      target: '85',
      weightage: 20,
      status: 'LOCKED',
    },
    {
      userId: emp1.id,
      cycleId: cycle.id,
      thrustArea: 'Safety',
      title: 'Zero Security Incidents',
      description: 'Maintain zero critical security vulnerabilities in production',
      uomType: 'ZERO',
      target: '0',
      weightage: 15,
      status: 'LOCKED',
    },
  ];

  for (const goal of goals) {
    await prisma.goal.create({ data: goal });
  }

  // Create sample goals for employee 2 (submitted, pending approval)
  const emp2Goals = [
    {
      userId: emp2.id,
      cycleId: cycle.id,
      thrustArea: 'Customer Satisfaction',
      title: 'Improve NPS Score',
      description: 'Enhance customer satisfaction through faster support response times',
      uomType: 'MIN_NUMERIC',
      target: '75',
      weightage: 25,
      status: 'SUBMITTED',
    },
    {
      userId: emp2.id,
      cycleId: cycle.id,
      thrustArea: 'Product Development',
      title: 'Launch Mobile App Beta',
      description: 'Deliver beta version of the companion mobile application',
      uomType: 'TIMELINE',
      target: '2026-08-15',
      weightage: 35,
      status: 'SUBMITTED',
    },
    {
      userId: emp2.id,
      cycleId: cycle.id,
      thrustArea: 'Efficiency',
      title: 'Reduce API Response Time',
      description: 'Optimize backend services to achieve sub-200ms response times',
      uomType: 'MAX_NUMERIC',
      target: '200',
      weightage: 25,
      status: 'SUBMITTED',
    },
    {
      userId: emp2.id,
      cycleId: cycle.id,
      thrustArea: 'Learning',
      title: 'Complete AWS Certification',
      description: 'Obtain AWS Solutions Architect certification',
      uomType: 'TIMELINE',
      target: '2026-12-31',
      weightage: 15,
      status: 'SUBMITTED',
    },
  ];

  for (const goal of emp2Goals) {
    await prisma.goal.create({ data: goal });
  }

  // Create escalation rules
  await prisma.escalationRule.createMany({
    data: [
      {
        name: 'Goal Submission Overdue',
        condition: 'GOAL_NOT_SUBMITTED',
        daysThreshold: 7,
        notifyRole: 'EMPLOYEE',
      },
      {
        name: 'Goal Approval Overdue',
        condition: 'GOAL_NOT_APPROVED',
        daysThreshold: 5,
        notifyRole: 'MANAGER',
      },
      {
        name: 'Check-in Not Completed',
        condition: 'CHECKIN_NOT_COMPLETED',
        daysThreshold: 7,
        notifyRole: 'MANAGER',
      },
    ],
  });

  // Create some notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: manager.id,
        type: 'GOAL_SUBMITTED',
        title: 'Goals Submitted for Review',
        message: 'Sneha Iyer has submitted 4 goals for your review.',
      },
      {
        userId: emp1.id,
        type: 'GOAL_APPROVED',
        title: 'Goals Approved',
        message: 'Your goals for FY 2026-27 have been approved by Rahul Verma.',
        read: true,
      },
      {
        userId: admin.id,
        type: 'CHECKIN_REMINDER',
        title: 'Q1 Check-in Window Opening',
        message: 'The Q1 check-in window opens in July. 3 employees have locked goals.',
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Admin:    admin@atomberg.com / password123');
  console.log('  Manager:  manager@atomberg.com / password123');
  console.log('  Employee: employee@atomberg.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
