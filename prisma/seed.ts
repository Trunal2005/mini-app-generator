import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const employeeDirectoryConfig = {
  version: "1.0",
  app: {
    name: "Employee Directory",
    description: "Manage your team members efficiently",
    theme: "dark",
  },
  auth: { enabled: true, roles: ["admin", "viewer"] },
  entities: [
    {
      name: "employees",
      label: "Employees",
      allowCsvImport: true,
      fields: [
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
          name: "department",
          label: "Department",
          type: "select",
          options: ["Engineering", "Marketing", "Sales", "HR", "Finance", "Design"],
        },
        { name: "salary", label: "Salary ($)", type: "number" },
        { name: "joinDate", label: "Join Date", type: "date" },
        { name: "active", label: "Active", type: "boolean", defaultValue: true },
        { name: "notes", label: "Notes", type: "textarea" },
      ],
    },
  ],
  pages: [
    {
      id: "emp-list",
      title: "All Employees",
      path: "/employees",
      type: "table",
      entity: "employees",
    },
    {
      id: "emp-add",
      title: "Add Employee",
      path: "/employees/new",
      type: "form",
      entity: "employees",
    },
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/",
      type: "dashboard",
      components: [
        { id: "c1", type: "stats-card", title: "Total Employees", entity: "employees", aggregation: "count" },
        { id: "c2", type: "stats-card", title: "Avg Salary", entity: "employees", field: "salary", aggregation: "avg" },
        { id: "c3", type: "bar-chart", title: "By Department", entity: "employees", field: "department" },
        { id: "c4", type: "data-table", title: "Recent Employees", entity: "employees" },
      ],
    },
  ],
};

const demoEmployees = [
  { id: "emp-1", name: "Alice Johnson", email: "alice@company.com", department: "Engineering", salary: 95000, joinDate: "2021-03-15", active: true, notes: "" },
  { id: "emp-2", name: "Bob Smith", email: "bob@company.com", department: "Marketing", salary: 72000, joinDate: "2020-07-01", active: true, notes: "" },
  { id: "emp-3", name: "Carol Williams", email: "carol@company.com", department: "Sales", salary: 68000, joinDate: "2022-01-10", active: true, notes: "" },
  { id: "emp-4", name: "David Brown", email: "david@company.com", department: "HR", salary: 65000, joinDate: "2019-11-20", active: false, notes: "On leave" },
  { id: "emp-5", name: "Eva Martinez", email: "eva@company.com", department: "Engineering", salary: 110000, joinDate: "2023-02-14", active: true, notes: "" },
  { id: "emp-6", name: "Frank Lee", email: "frank@company.com", department: "Design", salary: 88000, joinDate: "2021-09-05", active: true, notes: "" },
  { id: "emp-7", name: "Grace Kim", email: "grace@company.com", department: "Finance", salary: 80000, joinDate: "2020-04-22", active: true, notes: "" },
  { id: "emp-8", name: "Henry Davis", email: "henry@company.com", department: "Engineering", salary: 98000, joinDate: "2022-06-01", active: true, notes: "" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const hashedPassword = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@appforge.dev" },
    update: {},
    create: {
      email: "demo@appforge.dev",
      password: hashedPassword,
      name: "Demo User",
    },
  });
  console.log(`✅ Demo user: ${user.email} / password123`);

  // Create demo app
  const existingApp = await prisma.app.findFirst({
    where: { userId: user.id, name: "Employee Directory" },
  });

  const app = existingApp
    ? await prisma.app.update({
        where: { id: existingApp.id },
        data: { config: JSON.stringify(employeeDirectoryConfig) },
      })
    : await prisma.app.create({
        data: {
          name: "Employee Directory",
          description: "Manage your team members efficiently",
          config: JSON.stringify(employeeDirectoryConfig),
          userId: user.id,
        },
      });

  console.log(`✅ Demo app: ${app.id}`);

  // Create entity data
  await prisma.appEntity.upsert({
    where: { appId_entityName: { appId: app.id, entityName: "employees" } },
    update: { data: JSON.stringify(demoEmployees) },
    create: {
      appId: app.id,
      entityName: "employees",
      data: JSON.stringify(demoEmployees),
    },
  });

  console.log(`✅ Seeded ${demoEmployees.length} demo employees`);
  console.log("\n🎉 Done! Login at http://localhost:3000/login");
  console.log("   Email: demo@appforge.dev");
  console.log("   Password: password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
