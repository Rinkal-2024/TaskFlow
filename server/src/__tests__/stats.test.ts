import request from 'supertest';
import app from '../index';
import User from '../models/User';
import Task from '../models/Task';
import ActivityLog from '../models/ActivityLog';
import { UserRole, TaskStatus, TaskPriority, ActivityAction } from '../types';

describe('Statistics Endpoints', () => {
  let adminToken: string;
  let memberToken: string;
  let adminUser: any;
  let memberUser: any;

  const testTask = {
    title: 'Test Task',
    description: 'This is a test task',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['test', 'example'],
  };

  beforeEach(async () => {
    // Create admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'AdminPass123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin' as UserRole,
      });
    
    adminToken = adminResponse.body.data.token;
    adminUser = adminResponse.body.data.user;

    // Create member user
    const memberResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'member@test.com',
        password: 'MemberPass123',
        firstName: 'Member',
        lastName: 'User',
        role: 'member' as UserRole,
      });
    
    memberToken = memberResponse.body.data.token;
    memberUser = memberResponse.body.data.user;
  });

  describe('GET /api/stats/overview', () => {
    beforeEach(async () => {
      // Create test tasks
      await Task.create([
        {
          ...testTask,
          title: 'Task 1',
          status: 'todo',
          priority: 'low',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'Task 2',
          status: 'in-progress',
          priority: 'medium',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'Task 3',
          status: 'done',
          priority: 'high',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'Task 4',
          status: 'todo',
          priority: 'urgent',
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Overdue
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
      ]);
    });

    it('should get overview stats for admin', async () => {
      const response = await request(app)
        .get('/api/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.taskStats).toBeDefined();
      expect(response.body.data.taskStats.total).toBe(4);
      expect(response.body.data.taskStats.byStatus.todo).toBe(2);
      expect(response.body.data.taskStats.byStatus['in-progress']).toBe(1);
      expect(response.body.data.taskStats.byStatus.done).toBe(1);
      expect(response.body.data.taskStats.overdue).toBe(1);
      expect(response.body.data.totalUsers).toBe(2);
    });

    it('should get overview stats for member (only assigned tasks)', async () => {
      const response = await request(app)
        .get('/api/stats/overview')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.taskStats).toBeDefined();
      expect(response.body.data.taskStats.total).toBe(4);
      expect(response.body.data.totalUsers).toBeUndefined(); // Members don't see user count
    });
  });

  describe('GET /api/stats/user', () => {
    beforeEach(async () => {
      // Create test tasks for the member
      await Task.create([
        {
          ...testTask,
          title: 'Member Task 1',
          status: 'todo',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'Member Task 2',
          status: 'in-progress',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'Member Task 3',
          status: 'done',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'Member Task 4',
          status: 'todo',
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Overdue
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
      ]);
    });

    it('should get user stats for member', async () => {
      const response = await request(app)
        .get('/api/stats/user')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.myTasks).toBe(4);
      expect(response.body.data.completedTasks).toBe(1);
      expect(response.body.data.inProgressTasks).toBe(1);
      expect(response.body.data.overdueTasks).toBe(1);
      expect(response.body.data.completionRate).toBe(25); // 1 out of 4 completed = 25%
      expect(response.body.data.tasksThisWeek).toBeDefined();
      expect(response.body.data.tasksThisMonth).toBeDefined();
      expect(response.body.data.currentStreak).toBeDefined();
    });

    it('should calculate completion rate correctly', async () => {
      // Create more completed tasks
      await Task.create([
        {
          ...testTask,
          title: 'Completed Task 1',
          status: 'done',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'Completed Task 2',
          status: 'done',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
      ]);

      const response = await request(app)
        .get('/api/stats/user')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.data.myTasks).toBe(6);
      expect(response.body.data.completedTasks).toBe(3);
      expect(response.body.data.completionRate).toBe(50); // 3 out of 6 completed = 50%
    });
  });

  describe('GET /api/stats/team', () => {
    beforeEach(async () => {
      // Create additional member
      const member2Response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'member2@test.com',
          password: 'Member2Pass123',
          firstName: 'Member',
          lastName: 'Two',
          role: 'member' as UserRole,
        });
      
      const member2User = member2Response.body.data.user;

      // Create tasks for different users
      await Task.create([
        {
          ...testTask,
          title: 'Admin Task',
          status: 'done',
          createdBy: adminUser._id,
          assignee: adminUser._id,
        },
        {
          ...testTask,
          title: 'Member 1 Task',
          status: 'done',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'Member 2 Task',
          status: 'in-progress',
          createdBy: adminUser._id,
          assignee: member2User._id,
        },
      ]);

      // Create activity logs
      await ActivityLog.create([
        {
          taskId: '507f1f77bcf86cd799439011',
          userId: adminUser._id,
          action: ActivityAction.CREATED,
          timestamp: new Date(),
        },
        {
          taskId: '507f1f77bcf86cd799439012',
          userId: memberUser._id,
          action: ActivityAction.STATUS_CHANGED,
          timestamp: new Date(),
        },
      ]);
    });

    it('should get team performance stats for admin', async () => {
      const response = await request(app)
        .get('/api/stats/team')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userPerformance).toBeDefined();
      expect(response.body.data.teamSummary).toBeDefined();
      expect(response.body.data.activitySummary).toBeDefined();

      // Check team summary
      expect(response.body.data.teamSummary.totalMembers).toBe(3);
      expect(response.body.data.teamSummary.totalOverdueTasks).toBeDefined();

      // Check user performance
      const userPerformance = response.body.data.userPerformance;
      expect(userPerformance.length).toBeGreaterThan(0);
      
      // Find admin user performance
      const adminPerformance = userPerformance.find((user: any) => user.userId === adminUser._id);
      expect(adminPerformance).toBeDefined();
      expect(adminPerformance.totalTasks).toBe(1);
      expect(adminPerformance.completedTasks).toBe(1);
      expect(adminPerformance.completionRate).toBe(100);
    });

    it('should fail for member users', async () => {
      const response = await request(app)
        .get('/api/stats/team')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Admin access required');
    });
  });

  describe('GET /api/stats/system', () => {
    beforeEach(async () => {
      // Create test data
      await Task.create([
        {
          ...testTask,
          title: 'System Task 1',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['system', 'test'],
          description: 'System task with description',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'System Task 2',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
      ]);

      // Create activity logs
      await ActivityLog.create([
        {
          taskId: '507f1f77bcf86cd799439011',
          userId: adminUser._id,
          action: ActivityAction.CREATED,
          timestamp: new Date(),
        },
        {
          taskId: '507f1f77bcf86cd799439012',
          userId: memberUser._id,
          action: ActivityAction.UPDATED,
          timestamp: new Date(),
        },
      ]);
    });

    it('should get system health stats for admin', async () => {
      const response = await request(app)
        .get('/api/stats/system')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.systemMetrics).toBeDefined();
      expect(response.body.data.dataHealth).toBeDefined();
      expect(response.body.data.systemInfo).toBeDefined();

      // Check system metrics
      expect(response.body.data.systemMetrics.users).toBe(2);
      expect(response.body.data.systemMetrics.tasks).toBe(2);
      expect(response.body.data.systemMetrics.activityLogs).toBe(2);
      expect(response.body.data.systemMetrics.recentActivity24h).toBeDefined();

      // Check data health
      expect(response.body.data.dataHealth.tasks.total).toBe(2);
      expect(response.body.data.dataHealth.tasks.withDueDate).toBe(1);
      expect(response.body.data.dataHealth.tasks.withTags).toBe(1);
      expect(response.body.data.dataHealth.tasks.withDescription).toBe(1);
      expect(response.body.data.dataHealth.tasks.completenessScore).toBeGreaterThan(0);

      // Check system info
      expect(response.body.data.systemInfo.serverUptime).toBeDefined();
      expect(response.body.data.systemInfo.timestamp).toBeDefined();
    });

    it('should fail for member users', async () => {
      const response = await request(app)
        .get('/api/stats/system')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Admin access required');
    });
  });

  describe('GET /api/stats/analytics', () => {
    beforeEach(async () => {
      // Create tasks with different tags and dates
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      await Task.create([
        {
          ...testTask,
          title: 'Analytics Task 1',
          tags: ['analytics', 'data'],
          createdAt: sixMonthsAgo,
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'Analytics Task 2',
          tags: ['analytics', 'reporting'],
          createdAt: sixMonthsAgo,
          status: 'done',
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
        {
          ...testTask,
          title: 'Analytics Task 3',
          tags: ['data', 'insights'],
          createdBy: adminUser._id,
          assignee: memberUser._id,
        },
      ]);
    });

    it('should get analytics data for admin', async () => {
      const response = await request(app)
        .get('/api/stats/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tagDistribution).toBeDefined();
      expect(response.body.data.monthlyTrends).toBeDefined();
      expect(response.body.data.avgCompletionTimeHours).toBeDefined();

      // Check tag distribution
      const tagDistribution = response.body.data.tagDistribution;
      expect(tagDistribution.length).toBeGreaterThan(0);
      
      // Find analytics tag
      const analyticsTag = tagDistribution.find((tag: any) => tag._id === 'analytics');
      expect(analyticsTag).toBeDefined();
      expect(analyticsTag.count).toBe(2);

      // Check monthly trends
      const monthlyTrends = response.body.data.monthlyTrends;
      expect(monthlyTrends.length).toBeGreaterThan(0);
      
      // Find the month from 6 months ago
      const oldMonth = monthlyTrends.find((trend: any) => 
        trend.month.includes(sixMonthsAgo.getFullYear().toString())
      );
      expect(oldMonth).toBeDefined();
      expect(oldMonth.created).toBe(2);
      expect(oldMonth.completed).toBe(1);
      expect(oldMonth.completionRate).toBe(50);
    });

    it('should get analytics data for member (only assigned tasks)', async () => {
      const response = await request(app)
        .get('/api/stats/analytics')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tagDistribution).toBeDefined();
      
      // Member should see the same tag distribution since all tasks are assigned to them
      const tagDistribution = response.body.data.tagDistribution;
      expect(tagDistribution.length).toBeGreaterThan(0);
    });
  });
}); 