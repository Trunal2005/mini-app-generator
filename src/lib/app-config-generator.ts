import { AppConfig, FieldConfig, PageConfig } from "@/types/config.types";

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function baseConfig(name: string, description: string): AppConfig {
  return {
    version: "1.0",
    app: {
      name: name.trim() || "Generated App",
      description: description.trim() || "Generated from your description",
      theme: "dark",
    },
    auth: { enabled: false },
    entities: [],
    pages: [],
  };
}

function fields(names: FieldConfig[]) {
  return names;
}

function crudPages(entity: string, label: string): PageConfig[] {
  return [
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/",
      type: "dashboard",
      components: [
        { id: "total", type: "stats-card", title: `Total ${label}`, entity, aggregation: "count" },
        { id: "recent", type: "data-table", title: `Recent ${label}`, entity },
      ],
    },
    { id: `${entity}-table`, title: `All ${label}`, path: `/${entity}`, type: "table", entity },
    { id: `${entity}-form`, title: `Add ${label}`, path: `/${entity}/new`, type: "form", entity },
  ];
}

function flappyGameConfig(name: string, description: string): AppConfig {
  const config = baseConfig(name, description);
  config.pages = [
    {
      id: "play",
      title: "Play Game",
      path: "/",
      type: "game",
      experience: {
        kind: "flappy-bird",
        prompt: description,
        headline: titleCase(name || "Flappy Crown"),
        subheadline: description || "Guide the crowned bird through the pipes.",
      },
    },
  ];
  return config;
}

function landingConfig(name: string, description: string): AppConfig {
  const config = baseConfig(name, description);
  config.entities = [
    {
      name: "inquiries",
      label: "Inquiries",
      allowCsvImport: true,
      fields: fields([
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "message", label: "Message", type: "textarea", required: true },
        { name: "status", label: "Status", type: "select", options: ["New", "Contacted", "Closed"] },
      ]),
    },
  ];
  config.pages = [
    {
      id: "home",
      title: "Home",
      path: "/",
      type: "landing",
      experience: {
        kind: "landing",
        prompt: description,
        headline: titleCase(name || "Generated Site"),
        subheadline: description || "A polished generated site with lead capture.",
        cta: "Get Started",
        features: ["Responsive landing page", "Lead capture data model", "Dashboard-ready admin"],
      },
    },
    ...crudPages("inquiries", "Inquiries"),
  ];
  return config;
}

function employeeConfig(name: string, description: string): AppConfig {
  const config = baseConfig(name, description);
  config.entities = [
    {
      name: "employees",
      label: "Employees",
      allowCsvImport: true,
      fields: fields([
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "department", label: "Department", type: "select", options: ["Engineering", "Sales", "Marketing", "HR", "Finance"] },
        { name: "role", label: "Role", type: "text" },
        { name: "salary", label: "Salary", type: "number" },
        { name: "active", label: "Active", type: "boolean", defaultValue: true },
      ]),
    },
  ];
  config.pages = crudPages("employees", "Employees");
  return config;
}

function inventoryConfig(name: string, description: string): AppConfig {
  const config = baseConfig(name, description);
  config.entities = [
    {
      name: "products",
      label: "Products",
      allowCsvImport: true,
      fields: fields([
        { name: "name", label: "Product Name", type: "text", required: true },
        { name: "sku", label: "SKU", type: "text" },
        { name: "category", label: "Category", type: "select", options: ["Hardware", "Software", "Service", "Other"] },
        { name: "stock", label: "Stock", type: "number", required: true },
        { name: "price", label: "Price", type: "number" },
      ]),
    },
  ];
  config.pages = crudPages("products", "Products");
  return config;
}

function taskConfig(name: string, description: string): AppConfig {
  const config = baseConfig(name, description);
  config.entities = [
    {
      name: "tasks",
      label: "Tasks",
      fields: fields([
        { name: "title", label: "Title", type: "text", required: true },
        { name: "owner", label: "Owner", type: "text" },
        { name: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High"] },
        { name: "dueDate", label: "Due Date", type: "date" },
        { name: "done", label: "Done", type: "boolean", defaultValue: false },
      ]),
    },
  ];
  config.pages = crudPages("tasks", "Tasks");
  return config;
}

function shopConfig(name: string, description: string): AppConfig {
  const config = baseConfig(name, description);
  config.entities = [
    {
      name: "products",
      label: "Products",
      allowCsvImport: true,
      fields: fields([
        { name: "name", label: "Product Name", type: "text", required: true },
        { name: "price", label: "Price", type: "number", required: true },
        { name: "category", label: "Category", type: "select", options: ["Featured", "New", "Sale"] },
        { name: "available", label: "Available", type: "boolean", defaultValue: true },
      ]),
    },
    {
      name: "orders",
      label: "Orders",
      fields: fields([
        { name: "customer", label: "Customer", type: "text", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "total", label: "Total", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["Pending", "Paid", "Shipped"] },
      ]),
    },
  ];
  config.pages = [
    {
      id: "storefront",
      title: "Storefront",
      path: "/",
      type: "landing",
      experience: {
        kind: "landing",
        prompt: description,
        headline: titleCase(name || "Online Store"),
        subheadline: description || "A generated storefront with product and order management.",
        cta: "Browse Products",
        features: ["Product catalog", "Order tracking", "Admin dashboard"],
      },
    },
    ...crudPages("products", "Products"),
    { id: "orders-table", title: "Orders", path: "/orders", type: "table", entity: "orders" },
  ];
  return config;
}

export function generateConfigFromPrompt(appName: string, description = ""): AppConfig {
  const prompt = `${appName} ${description}`.toLowerCase();

  if (includesAny(prompt, ["flappy", "bird", "game", "arcade", "clone"])) {
    return flappyGameConfig(appName, description);
  }

  if (includesAny(prompt, ["employee", "staff", "hr", "directory", "team"])) {
    return employeeConfig(appName, description);
  }

  if (includesAny(prompt, ["inventory", "stock", "warehouse", "product tracker"])) {
    return inventoryConfig(appName, description);
  }

  if (includesAny(prompt, ["todo", "task", "kanban", "project"])) {
    return taskConfig(appName, description);
  }

  if (includesAny(prompt, ["shop", "store", "ecommerce", "e-commerce", "cart", "order"])) {
    return shopConfig(appName, description);
  }

  return landingConfig(appName, description);
}
