import request from "supertest";
import mongoose from "mongoose";
import app from "../index";
import User from "../models/User";
import Task from "../models/Task";
import { UserRole, TaskStatus } from "../types";

let adminToken: string;
let memberToken: string;
let adminUserId: string;
let memberUserId: string;

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URI_TEST || "mongodb://localhost:27017/task-manager-test",
  );

  await User.deleteMany({
    email: { $in: ["admin-users@test.com", "member-users@test.com"] },
  });
  await Task.deleteMany({});

  const admin = new User({
    email: "admin-users@test.com",
    password: "password123",
    firstName: "Admin",
    lastName: "User",
    role: UserRole.ADMIN,
  });
  await admin.save();
  adminUserId = admin._id.toString();

  const member = new User({
    email: "member-users@test.com",
    password: "password123",
    firstName: "Member",
    lastName: "User",
    role: UserRole.MEMBER,
  });
  await member.save();
  memberUserId = member._id.toString();

  const adminRes = await request(app).post("/api/auth/login").send({
    email: "admin-users@test.com",
    password: "password123",
  });
  adminToken = adminRes.body.data.token;

  const memberRes = await request(app).post("/api/auth/login").send({
    email: "member-users@test.com",
    password: "password123",
  });
  memberToken = memberRes.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("User Controller", () => {
  describe("GET /api/users", () => {
    it("should return paginated users for admin", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBeGreaterThan(0);
      expect(res.body.pagination).toHaveProperty("totalItems");
    });

    it("should filter users by role", async () => {
      const res = await request(app)
        .get("/api/users?role=admin")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.users.forEach((user: any) => {
        expect(user.role).toBe("admin");
      });
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return user details with task stats", async () => {
      await Task.create([
        {
          title: "Task 1",
          assignee: memberUserId,
          status: TaskStatus.TODO,
          createdBy: adminUserId,
        },
        {
          title: "Task 2",
          assignee: memberUserId,
          status: TaskStatus.DONE,
          createdBy: adminUserId,
        },
      ]);

      const res = await request(app)
        .get(`/api/users/${memberUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user._id).toBe(memberUserId);
      expect(res.body.data.taskStats.total).toBe(2);
      expect(res.body.data.taskStats.todo).toBe(1);
      expect(res.body.data.taskStats.done).toBe(1);
    });
  });

  describe("PUT /api/users/:id/role", () => {
    it("should update user role by admin", async () => {
      const res = await request(app)
        .patch(`/api/users/${memberUserId}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: UserRole.ADMIN });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe(UserRole.ADMIN);
    });

    it("should prevent user from changing their own role", async () => {
      const res = await request(app)
        .patch(`/api/users/${adminUserId}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: UserRole.MEMBER });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot change your own role/i);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete user without assigned tasks", async () => {
      const tempUser = new User({
        email: "temp@test.com",
        password: "password123",
        firstName: "Temp",
        lastName: "User",
        role: UserRole.MEMBER,
      });
      await tempUser.save();

      const res = await request(app)
        .delete(`/api/users/${tempUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);
    });

    it("should not delete user with assigned tasks", async () => {
      const res = await request(app)
        .delete(`/api/users/${memberUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/assigned task/i);
    });

    it("should prevent deleting own account", async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot delete your own account/i);
    });
  });
});
