import request from 'supertest';
import app from '../index';
import User from '../models/User';
import Task from '../models/Task';
import { UserRole, TaskStatus, TaskPriority } from '../types';

describe('Tasks Endpoints', () => {
  let adminToken: string;
  let memberToken: string;
  let adminUser: any;
  let memberUser: any;

  const testTask = {
    title: 'Test Task',
    description: 'This is a test task',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
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

  describe('POST /api/tasks', () => {
    it('should create a task successfully as admin', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testTask)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe(testTask.title);
      expect(response.body.data.task.description).toBe(testTask.description);
      expect(response.body.data.task.status).toBe(testTask.status);
      expect(response.body.data.task.priority).toBe(testTask.priority);
      expect(response.body.data.task.createdBy._id).toBe(adminUser._id);
    });

    it('should create a task as member and auto-assign to self', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(testTask)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.assignee._id).toBe(memberUser._id);
    });

    it('should fail with missing title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...testTask, title: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Title is required');
    });

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...testTask, status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid priority', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...testTask, priority: 'invalid-priority' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with past due date', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...testTask, dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Due date must be in the future');
    });
  });

  describe('GET /api/tasks', () => {
    let task1: any;
    let task2: any;

    beforeEach(async () => {
      // Create test tasks
      task1 = await Task.create({
        ...testTask,
        createdBy: adminUser._id,
        assignee: memberUser._id,
      });

      task2 = await Task.create({
        ...testTask,
        title: 'Another Test Task',
        createdBy: adminUser._id,
        assignee: adminUser._id,
      });
    });

    it('should get all tasks for admin', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should get only assigned tasks for member', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0]._id).toBe(task1._id);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=todo')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(2);
      expect(response.body.data.tasks.every((task: any) => task.status === 'todo')).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=medium')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(2);
      expect(response.body.data.tasks.every((task: any) => task.priority === 'medium')).toBe(true);
    });

    it('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/tasks?search=Another')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].title).toBe('Another Test Task');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.itemsPerPage).toBe(1);
    });
  });

  describe('GET /api/tasks/:id', () => {
    let task: any;

    beforeEach(async () => {
      task = await Task.create({
        ...testTask,
        createdBy: adminUser._id,
        assignee: memberUser._id,
      });
    });

    it('should get task by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(task._id);
      expect(response.body.data.title).toBe(task.title);
    });

    it('should get task by ID for assignee', async () => {
      const response = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(task._id);
    });

    it('should fail for non-assigned member', async () => {
      // Create another member
      const anotherMemberResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'another@test.com',
          password: 'AnotherPass123',
          firstName: 'Another',
          lastName: 'Member',
          role: 'member' as UserRole,
        });

      const response = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${anotherMemberResponse.body.data.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should fail with invalid task ID', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent task ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    let task: any;

    beforeEach(async () => {
      task = await Task.create({
        ...testTask,
        createdBy: adminUser._id,
        assignee: memberUser._id,
      });
    });

    it('should update task successfully as admin', async () => {
      const updates = {
        title: 'Updated Task Title',
        status: 'in-progress' as TaskStatus,
        priority: 'high' as TaskPriority,
      };

      const response = await request(app)
        .patch(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe(updates.title);
      expect(response.body.data.task.status).toBe(updates.status);
      expect(response.body.data.task.priority).toBe(updates.priority);
    });

    it('should update task successfully as assignee', async () => {
      const updates = {
        status: 'done' as TaskStatus,
      };

      const response = await request(app)
        .patch(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.status).toBe(updates.status);
    });

    it('should fail with invalid updates', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail for non-assigned member', async () => {
      // Create another member
      const anotherMemberResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'another@test.com',
          password: 'AnotherPass123',
          firstName: 'Another',
          lastName: 'Member',
          role: 'member' as UserRole,
        });

      const response = await request(app)
        .patch(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${anotherMemberResponse.body.data.token}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let task: any;

    beforeEach(async () => {
      task = await Task.create({
        ...testTask,
        createdBy: adminUser._id,
        assignee: memberUser._id,
      });
    });

    it('should delete task successfully as admin', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Task deleted successfully');

      // Verify task is deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('should fail for member users', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should fail with invalid task ID', async () => {
      const response = await request(app)
        .delete('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 