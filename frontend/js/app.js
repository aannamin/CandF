/* Browser-only data layer for the demo. Nothing is sent to a server. */
window.CFStorage = (() => {
  const keys = { users: "cf_users", submissions: "cf_submissions", session: "cf_session" };
  const read = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const normaliseRole = (role) => String(role).toLowerCase() === "admin" ? "admin" : "student";
  const createId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  function register({ name, email, password, role }) {
    name = String(name || "").trim();
    email = String(email || "").trim().toLowerCase();
    if (!name || !email || !password || !["student", "admin"].includes(String(role).toLowerCase())) {
      throw new Error("Please complete every field.");
    }
    const users = read(keys.users);
    if (users.some((user) => user.email === email)) throw new Error("An account with that email already exists.");
    users.push({ id: createId(), name, email, password, role: normaliseRole(role) });
    write(keys.users, users);
  }

  function login(email, password) {
    const user = read(keys.users).find((entry) => entry.email === String(email).trim().toLowerCase() && entry.password === password);
    if (!user) throw new Error("Incorrect email or password.");
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    localStorage.setItem(keys.session, JSON.stringify(sessionUser));
    return sessionUser;
  }

  function user() {
    try {
      return JSON.parse(localStorage.getItem(keys.session) || "null");
    } catch {
      logout();
      return null;
    }
  }
  function startGuest(role) {
    role = normaliseRole(role);
    const guest = { id: `guest-${role}`, name: role === "admin" ? "Guest Admin" : "Guest Student", role, guest: true };
    localStorage.setItem(keys.session, JSON.stringify(guest));
    return guest;
  }
  function ensureRole(role) {
    role = normaliseRole(role);
    const current = user();
    return current && current.role === role ? current : startGuest(role);
  }
  function logout() { localStorage.removeItem(keys.session); }
  function submissions() { return read(keys.submissions); }
  function addSubmission(values) {
    const current = user();
    if (!current) throw new Error("Please log in again.");
    const item = { id: createId(), userId: current.id, type: String(values.type || "").toLowerCase(), title: String(values.title || "").trim(), description: String(values.description || "").trim(), category: String(values.category || "").trim(), status: "pending", admin_note: "", createdAt: new Date().toISOString() };
    if (!item.type || !item.title || !item.description || !item.category) throw new Error("Please complete every field.");
    const items = submissions(); items.unshift(item); write(keys.submissions, items);
    return item;
  }
  function updateSubmission(id, changes) {
    const items = submissions(); const item = items.find((entry) => entry.id === id);
    if (!item) return;
    Object.assign(item, changes); write(keys.submissions, items);
  }
  return { register, login, user, startGuest, ensureRole, logout, submissions, addSubmission, updateSubmission };
})();
