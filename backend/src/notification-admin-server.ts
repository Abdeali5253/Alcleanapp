import crypto from "crypto";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import {
  listRegisteredDevices,
  sendNotificationToAll,
  sendNotificationToUser,
} from "./routes/notifications.js";

const ADMIN_HOST = "127.0.0.1";
const DEFAULT_ADMIN_PORT = 3011;

function secureEqual(actual: string, expected: string): boolean {
  const left = crypto.createHash("sha256").update(actual).digest();
  const right = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(left, right);
}

function parseBasicPassword(header?: string): string | undefined {
  const match = header?.match(/^Basic ([A-Za-z0-9+/=]+)$/);
  if (!match) return undefined;
  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0 || decoded.slice(0, separator) !== "admin")
      return undefined;
    return decoded.slice(separator + 1);
  } catch {
    return undefined;
  }
}

function requireAdmin(password: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const supplied = parseBasicPassword(req.headers.authorization);
    if (!supplied || !secureEqual(supplied, password)) {
      res.setHeader(
        "WWW-Authenticate",
        'Basic realm="AlClean Notification Admin"',
      );
      return res.status(401).send("Authentication required");
    }
    next();
  };
}

function validateMessage(value: unknown, name: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw Object.assign(
      new Error(`${name} is required and must be at most ${max} characters`),
      {
        status: 400,
      },
    );
  }
  return value.trim();
}

const adminCss = `
:root{
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;
  color:#18211a;
  background:#f3f6f2
}

*{box-sizing:border-box}

body{margin:0}

.top{
  background:#fff;
  border-bottom:1px solid #dde5da
}

.top div{
  max-width:1100px;
  margin:auto;
  padding:22px 24px
}

.eyebrow{
  margin:0;
  color:#5a9d35;
  font-size:12px;
  font-weight:800;
  letter-spacing:.12em
}

.top h1{
  margin:5px 0 4px;
  font-size:28px
}

.sub{
  margin:0;
  color:#667067
}

.grid{
  max-width:1100px;
  margin:24px auto;
  padding:0 24px;
  display:grid;
  grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);
  gap:20px
}

.card{
  background:#fff;
  border:1px solid #dde5da;
  border-radius:16px;
  box-shadow:0 8px 28px #173a1510;
  overflow:hidden;
  min-width:0
}

.card-head{
  padding:20px 22px;
  border-bottom:1px solid #edf1eb;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px
}

.card h2{
  margin:0;
  font-size:19px
}

.count{
  background:#eaf5e4;
  color:#39751e;
  padding:5px 10px;
  border-radius:999px;
  font-weight:700;
  font-size:13px
}

/* Registered devices table */
.table-wrap{
  width:100%;
  max-width:100%;
  max-height:520px;
  overflow-y:auto;
  overflow-x:hidden
}

table{
  border-collapse:collapse;
  width:100%;
  max-width:100%;
  table-layout:fixed;
  font-size:14px
}

th,
td{
  text-align:left;
  padding:13px 18px;
  border-bottom:1px solid #edf1eb;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis
}

th{
  position:sticky;
  top:0;
  background:#f9fbf8;
  color:#647064;
  font-size:12px;
  text-transform:uppercase;
  z-index:1
}

/* Column widths */
th:nth-child(1),
td:nth-child(1){
  width:17%
}

th:nth-child(2),
td:nth-child(2){
  width:27%
}

th:nth-child(3),
td:nth-child(3){
  width:38%
}

th:nth-child(4),
td:nth-child(4){
  width:18%
}

td.empty{
  text-align:center;
  color:#7b857c;
  padding:40px
}

.form{
  padding:22px;
  display:grid;
  gap:16px
}

label{
  font-size:13px;
  font-weight:750;
  color:#465046;
  display:grid;
  gap:7px
}

input,
textarea,
select{
  width:100%;
  border:1px solid #ccd7c8;
  border-radius:10px;
  padding:11px 12px;
  font:inherit;
  background:#fff;
  color:#18211a
}

textarea{
  min-height:130px;
  resize:vertical
}

input:focus,
textarea:focus,
select:focus{
  outline:3px solid #6db33f30;
  border-color:#6db33f
}

button{
  border:0;
  border-radius:10px;
  padding:11px 16px;
  font-weight:750;
  cursor:pointer
}

.primary{
  background:#67b238;
  color:#fff
}

.primary:hover{
  background:#579d2d
}

.secondary{
  background:#eef3eb;
  color:#344334
}

.secondary:hover{
  background:#e2eadf
}

button:disabled{
  opacity:.55;
  cursor:wait
}

.result{
  display:none;
  padding:12px;
  border-radius:10px;
  font-size:14px
}

.result.show{
  display:block
}

.result.ok{
  background:#eaf6e5;
  color:#2d6818
}

.result.error{
  background:#fff0ef;
  color:#a42c24
}

.hint{
  margin:0;
  color:#768076;
  font-size:12px;
  line-height:1.5
}

@media(max-width:760px){
  .grid{
    grid-template-columns:1fr;
    padding:0 14px;
    margin:14px auto
  }

  .top div{
    padding:18px
  }

  .top h1{
    font-size:24px
  }
}
`;

const adminScript = `
const byId=(id)=>document.getElementById(id);
async function api(path,options){const response=await fetch(path,options);const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Request failed");return data}
function cell(row,value){const td=document.createElement("td");td.textContent=value||"—";row.appendChild(td)}
async function loadDevices(){const button=byId("refresh");button.disabled=true;try{const data=await api("/api/devices");byId("count").textContent=String(data.count);const body=byId("deviceRows");body.replaceChildren();const users=new Set();data.devices.forEach((device)=>{const row=document.createElement("tr");cell(row,device.platform);cell(row,device.tokenPreview);cell(row,device.userId||"Anonymous");cell(row,new Date(device.lastActive).toLocaleString());body.appendChild(row);if(device.userId)users.add(device.userId)});if(!data.devices.length){const row=document.createElement("tr");const td=document.createElement("td");td.colSpan=4;td.className="empty";td.textContent="No registered devices yet";row.appendChild(td);body.appendChild(row)}const audience=byId("audience");const selected=audience.value;audience.replaceChildren(new Option("All registered devices",""));Array.from(users).sort().forEach((id)=>audience.add(new Option(id,id)));audience.value=selected}catch(error){showResult(error.message,false)}finally{button.disabled=false}}
function showResult(message,ok){const box=byId("result");box.textContent=message;box.className="result show "+(ok?"ok":"error")}
byId("refresh").addEventListener("click",loadDevices);
byId("composer").addEventListener("submit",async(event)=>{event.preventDefault();const audience=byId("audience").value;const prompt=audience?"Send this notification to the selected customer?":"Send this notification to every registered device?";if(!confirm(prompt))return;const button=byId("send");button.disabled=true;showResult("Sending…",true);try{const data=await api("/api/send",{method:"POST",headers:{"Content-Type":"application/json","X-AlClean-Admin":"1"},body:JSON.stringify({title:byId("title").value,body:byId("body").value,userId:audience||undefined})});showResult("Delivered: "+data.delivered+" · Failed: "+data.failed,true)}catch(error){showResult(error.message,false)}finally{button.disabled=false}});
loadDevices();
`;

const adminHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AlClean Notification Console</title><link rel="stylesheet" href="/admin.css"></head><body><header class="top"><div><p class="eyebrow">ALCLEAN OPERATIONS</p><h1>Notification Console</h1><p class="sub">View registered devices and send secure push notifications.</p></div></header><main class="grid"><section class="card"><div class="card-head"><h2>Registered devices</h2><div><span id="count" class="count">0</span> <button id="refresh" class="secondary" type="button">Refresh</button></div></div><div class="table-wrap"><table><thead><tr><th>Platform</th><th>Token</th><th>Customer</th><th>Last active</th></tr></thead><tbody id="deviceRows"></tbody></table></div></section><section class="card"><div class="card-head"><h2>Send notification</h2></div><form id="composer" class="form"><label>Audience<select id="audience"><option value="">All registered devices</option></select></label><label>Title<input id="title" maxlength="100" required placeholder="Order update"></label><label>Message<textarea id="body" maxlength="500" required placeholder="Write the notification message"></textarea></label><p class="hint">Device tokens are redacted. Broadcasts require confirmation and are rate-limited.</p><div id="result" class="result" role="status"></div><button id="send" class="primary" type="submit">Send notification</button></form></section></main><script src="/admin.js"></script></body></html>`;

export function createNotificationAdminApp(password: string, port: number) {
  const app = express();
  app.disable("x-powered-by");
  const allowedHosts = new Set([
    `localhost:${port}`,
    `127.0.0.1:${port}`,
    `[::1]:${port}`,
  ]);
  const allowedOrigins = new Set(
    Array.from(allowedHosts, (host) => `http://${host}`),
  );

  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'none'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (
      !req.headers.host ||
      !allowedHosts.has(req.headers.host.toLowerCase())
    ) {
      return res.status(403).send("Local SSH access only");
    }
    next();
  });
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(requireAdmin(password));
  app.use(express.json({ limit: "8kb" }));

  app.get("/", (_req, res) => res.type("html").send(adminHtml));
  app.get("/admin.css", (_req, res) => res.type("css").send(adminCss));
  app.get("/admin.js", (_req, res) => res.type("js").send(adminScript));
  app.get("/api/devices", (_req, res) => {
    const devices = listRegisteredDevices();
    res.json({ success: true, count: devices.length, devices });
  });
  app.post(
    "/api/send",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false,
    }),
    async (req, res, next) => {
      try {
        if (
          !allowedOrigins.has(req.headers.origin || "") ||
          req.headers["x-alclean-admin"] !== "1"
        ) {
          return res
            .status(403)
            .json({ success: false, error: "Invalid request origin" });
        }
        const title = validateMessage(req.body?.title, "Title", 100);
        const body = validateMessage(req.body?.body, "Message", 500);
        const userId = req.body?.userId;
        if (
          userId !== undefined &&
          (typeof userId !== "string" || !userId.trim())
        ) {
          return res
            .status(400)
            .json({ success: false, error: "Invalid customer" });
        }
        const result = userId
          ? await sendNotificationToUser({ userId: userId.trim(), title, body })
          : await sendNotificationToAll({ title, body });
        const delivered = result.success;
        const failed = result.failure;
        console.log(
          `[Notification Admin] Send complete: ${delivered} delivered, ${failed} failed`,
        );
        res.json({ success: failed === 0, delivered, failed });
      } catch (error) {
        next(error);
      }
    },
  );
  app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = Number(error?.status);
    res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      error: status === 400 ? error.message : "Notification operation failed",
    });
  });
  return app;
}

export function startNotificationAdminServer() {
  const password = process.env.NOTIFICATION_ADMIN_PASSWORD;
  if (!password) {
    console.log(
      "Notification admin GUI: Disabled (NOTIFICATION_ADMIN_PASSWORD not set)",
    );
    return;
  }
  if (password.length < 8) {
    throw new Error(
      "NOTIFICATION_ADMIN_PASSWORD must contain at least 8 characters",
    );
  }
  const port = Number(
    process.env.NOTIFICATION_ADMIN_PORT || DEFAULT_ADMIN_PORT,
  );
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("NOTIFICATION_ADMIN_PORT must be between 1024 and 65535");
  }
  createNotificationAdminApp(password, port).listen(port, ADMIN_HOST, () => {
    console.log(
      `Notification admin GUI: http://${ADMIN_HOST}:${port} (SSH tunnel only)`,
    );
  });
}
