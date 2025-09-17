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
let taskId: string;

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URI_TEST || "mongodb://localhost:27017/task-manager-test",
  );

  await User.deleteMany({});
  await Task.deleteMany({});

  const admin = new User({
    email: "admin@test.com",
    password: "password123",
    firstName: "Admin",
    lastName: "User",
    role: UserRole.ADMIN,
  });
  await admin.save();
  adminUserId = admin._id.toString();

  const member = new User({
    email: "member@test.com",
    password: "password123",
    firstName: "Member",
    lastName: "User",
    role: UserRole.MEMBER,
  });
  await member.save();
  memberUserId = member._id.toString();

  const adminRes = await request(app).post("/api/auth/login").send({
    email: "admin@test.com",
    password: "password123",
  });
  adminToken = adminRes.body.data.token;

  const memberRes = await request(app).post("/api/auth/login").send({
    email: "member@test.com",
    password: "password123",
  });
  memberToken = memberRes.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Task CRUD operations", () => {
  it("Member can create a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        title: "Test Task",
        description: "Test description",
        status: TaskStatus.TODO,
        priority: "medium",
        dueDate: new Date(Date.now() + 86400000),
        tags: ["test", "urgent"],
        assignee: memberUserId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.task).toHaveProperty("title", "Test Task");
    taskId = res.body.data.task._id;
  });

  it("Member can only read their own tasks", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    res.body.data.tasks.forEach((task: any) => {
      const assigneeId = task.assignee._id || task.assignee;
      expect(assigneeId).toBe(memberUserId);
    });
  });

  it("Admin can read all tasks", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);
  });

  it("Admin can delete any task", async () => {
    expect(taskId).toBeDefined();

    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 204]).toContain(res.status);
  });

  it("Member cannot delete others' tasks", async () => {
    const adminTask = await Task.create({
      title: "Admin Task",
      assignee: adminUserId,
      createdBy: adminUserId,
    });

    const res = await request(app)
      .delete(`/api/tasks/${adminTask._id}`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });
});
