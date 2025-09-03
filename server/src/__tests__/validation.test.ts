import request from 'supertest';
import app from '../index';
import { UserRole } from '../types';

describe('Validation Middleware', () => {
  let adminToken: string;

  beforeEach(async () => {
    // Create admin user for testing
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@validation.com',
        password: 'AdminPass123',
        firstName: 'Admin',
        lastName: 'Validation',
        role: 'admin' as UserRole,
      });
    
    adminToken = adminResponse.body.data.token;
  });

  describe('Authentication Validation', () => {
    describe('User Registration', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Validation failed');
        expect(response.body.validationErrors).toBeDefined();
        
        // Check specific field errors
        const errors = response.body.validationErrors;
        expect(errors.email).toBeDefined();
        expect(errors.password).toBeDefined();
        expect(errors.firstName).toBeDefined();
        expect(errors.lastName).toBeDefined();
      });

      it('should validate email format', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            password: 'ValidPass123',
            firstName: 'Test',
            lastName: 'User',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.email).toBeDefined();
      });

      it('should validate password strength', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'weak',
            firstName: 'Test',
            lastName: 'User',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.password).toBeDefined();
      });

      it('should validate name format', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'ValidPass123',
            firstName: '123',
            lastName: '456',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.firstName).toBeDefined();
        expect(response.body.validationErrors.lastName).toBeDefined();
      });

      it('should validate role enum', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'ValidPass123',
            firstName: 'Test',
            lastName: 'User',
            role: 'invalid-role',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.role).toBeDefined();
      });
    });

    describe('User Login', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors).toBeDefined();
        expect(response.body.validationErrors.email).toBeDefined();
        expect(response.body.validationErrors.password).toBeDefined();
      });

      it('should validate email format', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'invalid-email',
            password: 'ValidPass123',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.email).toBeDefined();
      });
    });

    describe('Password Change', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors).toBeDefined();
        expect(response.body.validationErrors.currentPassword).toBeDefined();
        expect(response.body.validationErrors.newPassword).toBeDefined();
        expect(response.body.validationErrors.confirmPassword).toBeDefined();
      });

      it('should validate password strength for new password', async () => {
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            currentPassword: 'AdminPass123',
            newPassword: 'weak',
            confirmPassword: 'weak',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.newPassword).toBeDefined();
      });

      it('should validate password confirmation match', async () => {
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            currentPassword: 'AdminPass123',
            newPassword: 'NewPass123',
            confirmPassword: 'DifferentPass123',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Password confirmation does not match');
      });
    });

    describe('Profile Update', () => {
      it('should validate name format', async () => {
        const response = await request(app)
          .patch('/api/auth/profile')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: '123',
            lastName: '456',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.firstName).toBeDefined();
        expect(response.body.validationErrors.lastName).toBeDefined();
      });

      it('should allow valid name updates', async () => {
        const response = await request(app)
          .patch('/api/auth/profile')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: 'Updated',
            lastName: 'Name',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.firstName).toBe('Updated');
        expect(response.body.data.lastName).toBe('Name');
      });
    });
  });

  describe('Task Validation', () => {
    describe('Task Creation', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors).toBeDefined();
        expect(response.body.validationErrors.title).toBeDefined();
        expect(response.body.validationErrors.status).toBeDefined();
        expect(response.body.validationErrors.priority).toBeDefined();
      });

      it('should validate title length', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'A'.repeat(201), // Exceeds max length
            description: 'Valid description',
            status: 'todo',
            priority: 'medium',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.title).toBeDefined();
      });

      it('should validate status enum', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Valid Title',
            description: 'Valid description',
            status: 'invalid-status',
            priority: 'medium',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.status).toBeDefined();
      });

      it('should validate priority enum', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Valid Title',
            description: 'Valid description',
            status: 'todo',
            priority: 'invalid-priority',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.priority).toBeDefined();
      });

      it('should validate due date format', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Valid Title',
            description: 'Valid description',
            status: 'todo',
            priority: 'medium',
            dueDate: 'invalid-date',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.dueDate).toBeDefined();
      });

      it('should validate tags array', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Valid Title',
            description: 'Valid description',
            status: 'todo',
            priority: 'medium',
            tags: 'not-an-array',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.tags).toBeDefined();
      });

      it('should validate assignee ID format', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Valid Title',
            description: 'Valid description',
            status: 'todo',
            priority: 'medium',
            assigneeId: 'invalid-id',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.assigneeId).toBeDefined();
      });
    });

    describe('Task Update', () => {
      it('should validate status enum on update', async () => {
        const response = await request(app)
          .patch('/api/tasks/invalid-task-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'invalid-status',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate priority enum on update', async () => {
        const response = await request(app)
          .patch('/api/tasks/invalid-task-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            priority: 'invalid-priority',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('User Management Validation', () => {
    describe('Role Update', () => {
      it('should validate role enum', async () => {
        const response = await request(app)
          .patch('/api/users/invalid-user-id/role')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            role: 'invalid-role',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.role).toBeDefined();
      });

      it('should require role field', async () => {
        const response = await request(app)
          .patch('/api/users/invalid-user-id/role')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors.role).toBeDefined();
      });
    });
  });

  describe('Query Parameter Validation', () => {
    describe('Pagination', () => {
      it('should validate page number', async () => {
        const response = await request(app)
          .get('/api/tasks?page=invalid')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate limit number', async () => {
        const response = await request(app)
          .get('/api/tasks?limit=invalid')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate limit range', async () => {
        const response = await request(app)
          .get('/api/tasks?limit=1000') // Exceeds max limit
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Filtering', () => {
      it('should validate status filter', async () => {
        const response = await request(app)
          .get('/api/tasks?status=invalid-status')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate priority filter', async () => {
        const response = await request(app)
          .get('/api/tasks?priority=invalid-priority')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error structure', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('validationErrors');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });

    it('should include field-specific error messages', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'weak',
        })
        .expect(400);

      const errors = response.body.validationErrors;
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
      expect(errors.firstName).toBeDefined();
      expect(errors.lastName).toBeDefined();
    });
  });
}); 