import request from 'supertest';
import app from '../index';
import User from '../models/User';
import { UserRole } from '../types';

describe('Users Endpoints', () => {
  let adminToken: string;
  let memberToken: string;
  let adminUser: any;
  let memberUser: any;

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

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Create additional users
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user1@test.com',
          password: 'User1Pass123',
          firstName: 'User',
          lastName: 'One',
          role: 'member' as UserRole,
        });

      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user2@test.com',
          password: 'User2Pass123',
          firstName: 'User',
          lastName: 'Two',
          role: 'member' as UserRole,
        });
    });

    it('should get all users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      
      // Should have 4 users total (admin, member, user1, user2)
      expect(response.body.data.users.length).toBe(4);
      
      // Check that sensitive data is not exposed
      const firstUser = response.body.data.users[0];
      expect(firstUser.password).toBeUndefined();
      expect(firstUser.__v).toBeUndefined();
      expect(firstUser._id).toBeDefined();
      expect(firstUser.email).toBeDefined();
      expect(firstUser.firstName).toBeDefined();
      expect(firstUser.lastName).toBeDefined();
      expect(firstUser.role).toBeDefined();
    });

    it('should paginate users correctly', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBe(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.itemsPerPage).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/users?search=User')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      
      // All returned users should have "User" in their name
      const allHaveUserInName = response.body.data.users.every((user: any) => 
        user.firstName.includes('User') || user.lastName.includes('User')
      );
      expect(allHaveUserInName).toBe(true);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/users?role=member')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      
      // All returned users should be members
      const allAreMembers = response.body.data.users.every((user: any) => 
        user.role === 'member'
      );
      expect(allAreMembers).toBe(true);
    });

    it('should fail for member users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Admin access required');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(memberUser._id);
      expect(response.body.data.email).toBe(memberUser.email);
      expect(response.body.data.firstName).toBe(memberUser.firstName);
      expect(response.body.data.lastName).toBe(memberUser.lastName);
      expect(response.body.data.role).toBe(memberUser.role);
      
      // Sensitive data should not be exposed
      expect(response.body.data.password).toBeUndefined();
    });

    it('should get own profile for member', async () => {
      const response = await request(app)
        .get(`/api/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(memberUser._id);
    });

    it('should fail for member accessing other user profile', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should fail with invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent user ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('should update user role successfully as admin', async () => {
      const response = await request(app)
        .patch(`/api/users/${memberUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.message).toContain('User role updated successfully');
    });

    it('should fail with invalid role', async () => {
      const response = await request(app)
        .patch(`/api/users/${memberUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid-role' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid role');
    });

    it('should fail for member users', async () => {
      const response = await request(app)
        .patch(`/api/users/${adminUser._id}/role`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ role: 'member' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Admin access required');
    });

    it('should fail when admin tries to change own role', async () => {
      const response = await request(app)
        .patch(`/api/users/${adminUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'member' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot change your own role');
    });

    it('should fail with missing role in request body', async () => {
      const response = await request(app)
        .patch(`/api/users/${memberUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Role is required');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully as admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${memberUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(memberUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should fail for member users', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Admin access required');
    });

    it('should fail when admin tries to delete themselves', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot delete your own account');
    });

    it('should fail with invalid user ID', async () => {
      const response = await request(app)
        .delete('/api/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent user ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('User Management Edge Cases', () => {
    it('should handle bulk operations correctly', async () => {
      // Create multiple users
      const userPromises = Array.from({ length: 5 }, (_, i) => 
        request(app)
          .post('/api/auth/register')
          .send({
            email: `bulkuser${i}@test.com`,
            password: `BulkPass${i}123`,
            firstName: `Bulk`,
            lastName: `User${i}`,
            role: 'member' as UserRole,
          })
      );

      await Promise.all(userPromises);

      // Get all users
      const response = await request(app)
        .get('/api/users?limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBe(7); // 2 original + 5 bulk users
    });

    it('should maintain data integrity when deleting users', async () => {
      // Create a user with specific data
      const testUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'integrity@test.com',
          password: 'IntegrityPass123',
          firstName: 'Integrity',
          lastName: 'Test',
          role: 'member' as UserRole,
        });

      const testUserId = testUserResponse.body.data.user._id;

      // Verify user exists
      const userExists = await User.findById(testUserId);
      expect(userExists).toBeTruthy();

      // Delete user
      await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify user is completely removed
      const userDeleted = await User.findById(testUserId);
      expect(userDeleted).toBeNull();

      // Verify no duplicate emails exist
      const duplicateEmails = await User.find({ email: 'integrity@test.com' });
      expect(duplicateEmails.length).toBe(0);
    });
  });
}); 