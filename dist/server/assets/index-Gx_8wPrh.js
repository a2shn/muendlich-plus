import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Plus, Paintbrush, GripVertical, Trash2, XIcon, AlertCircle, Calendar, Lock, PlusCircle, BarChart3, TrendingUp, Award, GraduationCap, ChevronDownIcon, CheckIcon, ChevronUpIcon, AlertTriangle, CalendarDays, X, Bell, BellOff, History, LayoutGrid, BookOpen, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
const DB_NAME = "OralParticipationDB";
const DB_VERSION = 3;
class ParticipationDB {
  constructor() {
    this.db = null;
  }
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("subjects")) {
          const subjectStore = db.createObjectStore("subjects", { keyPath: "id" });
          subjectStore.createIndex("order", "order", { unique: false });
        }
        if (!db.objectStoreNames.contains("evaluationTypes")) {
          const evalStore = db.createObjectStore("evaluationTypes", { keyPath: "id" });
          evalStore.createIndex("order", "order", { unique: false });
        }
        if (!db.objectStoreNames.contains("entries")) {
          const entryStore = db.createObjectStore("entries", { keyPath: "id" });
          entryStore.createIndex("date", "date", { unique: false });
          entryStore.createIndex("subjectId", "subjectId", { unique: false });
          entryStore.createIndex("dateSubject", ["date", "subjectId"], { unique: false });
        }
        if (!db.objectStoreNames.contains("dayNotes")) {
          const noteStore = db.createObjectStore("dayNotes", { keyPath: "id" });
          noteStore.createIndex("dateSubject", ["date", "subjectId"], { unique: false });
        }
        if (!db.objectStoreNames.contains("scheduleSlots")) {
          const scheduleStore = db.createObjectStore("scheduleSlots", { keyPath: "id" });
          scheduleStore.createIndex("subjectId", "subjectId", { unique: false });
        } else if (event.oldVersion < 3) {
          const transaction = event.target.transaction;
          const scheduleStore = transaction.objectStore("scheduleSlots");
          if (scheduleStore.indexNames.contains("dayPeriod")) {
            scheduleStore.deleteIndex("dayPeriod");
          }
        }
        if (!db.objectStoreNames.contains("weekSystemSettings")) {
          db.createObjectStore("weekSystemSettings", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("grades")) {
          const gradeStore = db.createObjectStore("grades", { keyPath: "id" });
          gradeStore.createIndex("subjectId", "subjectId", { unique: false });
          gradeStore.createIndex("date", "date", { unique: false });
        }
        if (!db.objectStoreNames.contains("gradeReminder")) {
          db.createObjectStore("gradeReminder", { keyPath: "id" });
        }
      };
    });
  }
  getStore(storeName, mode = "readonly") {
    if (!this.db) throw new Error("Database not initialized");
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }
  // Subjects
  async getSubjects() {
    const store = this.getStore("subjects");
    return new Promise((resolve, reject) => {
      const request = store.index("order").getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  async addSubject(subject) {
    const newSubject = {
      ...subject,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    const store = this.getStore("subjects", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(newSubject);
      request.onsuccess = () => resolve(newSubject);
      request.onerror = () => reject(request.error);
    });
  }
  async updateSubject(id, updates) {
    const store = this.getStore("subjects", "readwrite");
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const subject = getRequest.result;
        if (!subject) {
          reject(new Error("Subject not found"));
          return;
        }
        const updated = { ...subject, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
  async deleteSubject(id) {
    const store = this.getStore("subjects", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  // Evaluation Types
  async getEvaluationTypes() {
    const store = this.getStore("evaluationTypes");
    return new Promise((resolve, reject) => {
      const request = store.index("order").getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  async addEvaluationType(evalType) {
    const newEvalType = {
      ...evalType,
      id: crypto.randomUUID()
    };
    const store = this.getStore("evaluationTypes", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(newEvalType);
      request.onsuccess = () => resolve(newEvalType);
      request.onerror = () => reject(request.error);
    });
  }
  async updateEvaluationType(id, updates) {
    const store = this.getStore("evaluationTypes", "readwrite");
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const evalType = getRequest.result;
        if (!evalType) {
          reject(new Error("Evaluation type not found"));
          return;
        }
        const updated = { ...evalType, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
  async deleteEvaluationType(id) {
    const store = this.getStore("evaluationTypes", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  // Participation Entries
  async getEntriesForDate(date) {
    const store = this.getStore("entries");
    return new Promise((resolve, reject) => {
      const request = store.index("date").getAll(date);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  async getEntriesForDateAndSubject(date, subjectId) {
    const store = this.getStore("entries");
    return new Promise((resolve, reject) => {
      const request = store.index("dateSubject").getAll([date, subjectId]);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  async addEntry(entry) {
    const newEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    const store = this.getStore("entries", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(newEntry);
      request.onsuccess = () => resolve(newEntry);
      request.onerror = () => reject(request.error);
    });
  }
  async updateEntry(id, updates) {
    const store = this.getStore("entries", "readwrite");
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (!entry) {
          reject(new Error("Entry not found"));
          return;
        }
        const updated = { ...entry, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
  async deleteEntry(id) {
    const store = this.getStore("entries", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  // Day Notes
  async getDayNote(date, subjectId) {
    const store = this.getStore("dayNotes");
    return new Promise((resolve, reject) => {
      const request = store.index("dateSubject").get([date, subjectId]);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  async saveDayNote(note) {
    const store = this.getStore("dayNotes", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.index("dateSubject").get([note.date, note.subjectId]);
      request.onsuccess = () => {
        const existing = request.result;
        const dayNote = existing ? { ...existing, note: note.note, timestamp: Date.now() } : { ...note, id: crypto.randomUUID(), timestamp: Date.now() };
        const putRequest = store.put(dayNote);
        putRequest.onsuccess = () => resolve(dayNote);
        putRequest.onerror = () => reject(putRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }
  async getScheduleSlots() {
    const store = this.getStore("scheduleSlots");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  async addScheduleSlot(slot) {
    const newSlot = {
      ...slot,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    const store = this.getStore("scheduleSlots", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(newSlot);
      request.onsuccess = () => resolve(newSlot);
      request.onerror = () => reject(request.error);
    });
  }
  async deleteScheduleSlot(id) {
    const store = this.getStore("scheduleSlots", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async clearScheduleSlots() {
    const store = this.getStore("scheduleSlots", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async getGrades() {
    const store = this.getStore("grades");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  async getGradesBySubject(subjectId) {
    const store = this.getStore("grades");
    return new Promise((resolve, reject) => {
      const request = store.index("subjectId").getAll(subjectId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  async addGrade(grade) {
    const newGrade = {
      ...grade,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    const store = this.getStore("grades", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(newGrade);
      request.onsuccess = () => resolve(newGrade);
      request.onerror = () => reject(request.error);
    });
  }
  async deleteGrade(id) {
    const store = this.getStore("grades", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async getGradeReminder() {
    const store = this.getStore("gradeReminder");
    return new Promise((resolve, reject) => {
      const request = store.get("settings");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  async saveGradeReminder(reminder) {
    const data = { ...reminder, id: "settings" };
    const store = this.getStore("gradeReminder", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async getWeekSystemSettings() {
    const store = this.getStore("weekSystemSettings");
    return new Promise((resolve, reject) => {
      const request = store.get("settings");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  async saveWeekSystemSettings(settings) {
    const data = { ...settings, id: "settings" };
    const store = this.getStore("weekSystemSettings", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  // Initialize default data
  async initializeDefaults() {
    const subjects = await this.getSubjects();
    if (subjects.length === 0) {
      await this.addSubject({ name: "Mathematik", color: "#3b82f6", order: 0 });
      await this.addSubject({ name: "Deutsch", color: "#ef4444", order: 1 });
      await this.addSubject({ name: "Englisch", color: "#10b981", order: 2 });
    }
    const evalTypes = await this.getEvaluationTypes();
    if (evalTypes.length === 0) {
      await this.addEvaluationType({ name: "Richtig", color: "#10b981", order: 0 });
      await this.addEvaluationType({ name: "Teilweise richtig", color: "#f59e0b", order: 1 });
      await this.addEvaluationType({ name: "Falsch", color: "#ef4444", order: 2 });
      await this.addEvaluationType({ name: "Nicht relevant", color: "#6b7280", order: 3 });
      await this.addEvaluationType({ name: "Gemeldet", color: "#8b5cf6", order: 4 });
    }
  }
}
let dbInstance = null;
async function getDB() {
  if (!dbInstance) {
    dbInstance = new ParticipationDB();
    await dbInstance.init();
    await dbInstance.initializeDefaults();
  }
  return dbInstance;
}
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function parseDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function isPastDate(dateStr) {
  const date = parseDate(dateStr);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}
function formatDisplayDate(dateStr) {
  const date = parseDate(dateStr);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  return date.toLocaleDateString("de-DE", options);
}
function getDayOfWeek(date) {
  const day = date.getDay();
  if (day === 0) return -1;
  if (day === 6) return -1;
  return day - 1;
}
function getCurrentWeekType(date, referenceDate) {
  const refDate = parseDate(referenceDate);
  const currentDate = new Date(date);
  const getMonday = (d) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  const refMonday = getMonday(new Date(refDate));
  const currentMonday = getMonday(new Date(currentDate));
  refMonday.setHours(0, 0, 0, 0);
  currentMonday.setHours(0, 0, 0, 0);
  const weeksDiff = Math.floor((currentMonday.getTime() - refMonday.getTime()) / (7 * 24 * 60 * 60 * 1e3));
  return weeksDiff % 2 === 0 ? "A" : "B";
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "button",
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}
function DropdownMenu({
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Root, { "data-slot": "dropdown-menu", ...props });
}
function DropdownMenuTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Trigger,
    {
      "data-slot": "dropdown-menu-trigger",
      ...props
    }
  );
}
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Content,
    {
      "data-slot": "dropdown-menu-content",
      sideOffset,
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className
      ),
      ...props
    }
  ) });
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Item,
    {
      "data-slot": "dropdown-menu-item",
      "data-inset": inset,
      "data-variant": variant,
      className: cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function ThemeToggle() {
  const { setTheme } = useTheme();
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", children: [
      /* @__PURE__ */ jsx(Sun, { className: "h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" }),
      /* @__PURE__ */ jsx(Moon, { className: "absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" }),
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Theme wechseln" })
    ] }) }),
    /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
      /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("light"), children: [
        /* @__PURE__ */ jsx(Sun, { className: "mr-2 h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { children: "Hell" })
      ] }),
      /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("dark"), children: [
        /* @__PURE__ */ jsx(Moon, { className: "mr-2 h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { children: "Dunkel" })
      ] }),
      /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("system"), children: [
        /* @__PURE__ */ jsx(Monitor, { className: "mr-2 h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { children: "System" })
      ] })
    ] })
  ] });
}
function Header({ currentDate }) {
  const [weekSettings, setWeekSettings] = useState(null);
  const [currentWeekType, setCurrentWeekType] = useState("A");
  useEffect(() => {
    loadWeekSettings();
  }, [currentDate]);
  const loadWeekSettings = async () => {
    try {
      const db = await getDB();
      const settings = await db.getWeekSystemSettings();
      setWeekSettings(settings);
      if (settings?.enabled && settings.referenceDate) {
        const dateObj = parseDate(currentDate);
        const weekType = getCurrentWeekType(dateObj, settings.referenceDate);
        setCurrentWeekType(weekType);
      }
    } catch (error) {
      console.error("[calendar+] Failed to load week settings:", error);
    }
  };
  return /* @__PURE__ */ jsx("header", { className: "border-b bg-card sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-card/95", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-4 max-w-7xl", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Mündliche Beteiligung" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: formatDisplayDate(currentDate) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      weekSettings?.enabled && /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Woche" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-bold", children: [
          currentWeekType,
          "-Woche"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right hidden sm:block", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Schuljahr" }),
        /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "2024/2025" })
      ] }),
      /* @__PURE__ */ jsx(ThemeToggle, {})
    ] })
  ] }) }) });
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-title",
      className: cn("leading-none font-semibold", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-6", className),
      ...props
    }
  );
}
const PRESET_COLORS$1 = [
  "#3b82f6",
  // blue
  "#ef4444",
  // red
  "#10b981",
  // green
  "#f59e0b",
  // amber
  "#8b5cf6",
  // violet
  "#ec4899",
  // pink
  "#14b8a6",
  // teal
  "#f97316"
  // orange
];
function SubjectManager({ subjects, onSubjectsChange }) {
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS$1[0]);
  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const db = await getDB();
      await db.addSubject({
        name: newSubjectName.trim(),
        color: selectedColor,
        order: subjects.length
      });
      setNewSubjectName("");
      onSubjectsChange();
    } catch (error) {
      console.error("[calendar+] Failed to add subject:", error);
    }
  };
  const handleDeleteSubject = async (id) => {
    if (!confirm("Fach wirklich löschen? Alle zugehörigen Einträge bleiben erhalten.")) return;
    try {
      const db = await getDB();
      await db.deleteSubject(id);
      onSubjectsChange();
    } catch (error) {
      console.error("[calendar+] Failed to delete subject:", error);
    }
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Fächer verwalten" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Erstelle und verwalte deine Schulfächer für die tägliche Erfassung" })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Neues Fach eingeben...",
              value: newSubjectName,
              onChange: (e) => setNewSubjectName(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && handleAddSubject(),
              className: "flex-1"
            }
          ),
          /* @__PURE__ */ jsx(Button, { onClick: handleAddSubject, size: "icon", children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground ml-1", children: "Farbe wählen" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "relative group", children: /* @__PURE__ */ jsxs(
              "div",
              {
                className: "w-10 h-10 rounded-md border shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110",
                style: { backgroundColor: selectedColor },
                children: [
                  /* @__PURE__ */ jsx(Paintbrush, { className: "h-4 w-4 text-white mix-blend-difference opacity-70" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "color",
                      value: selectedColor,
                      onChange: (e) => setSelectedColor(e.target.value),
                      className: "absolute inset-0 opacity-0 cursor-pointer w-full h-full",
                      title: "Eigene Farbe wählen"
                    }
                  )
                ]
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-border mx-1" }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-2 flex-wrap", children: PRESET_COLORS$1.map((color) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedColor(color),
                className: "w-8 h-8 rounded-md transition-transform hover:scale-110",
                style: {
                  backgroundColor: color,
                  border: selectedColor === color ? "2px solid currentColor" : "1px solid transparent",
                  outline: selectedColor === color ? "2px solid #000" : "none",
                  outlineOffset: "1px",
                  opacity: selectedColor === color ? 1 : 0.7
                },
                "aria-label": `Farbe ${color}`
              },
              color
            )) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: subjects.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground py-8", children: "Noch keine Fächer vorhanden. Erstelle dein erstes Fach oben." }) : subjects.map((subject) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
          children: [
            /* @__PURE__ */ jsx(GripVertical, { className: "h-5 w-5 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-4 h-4 rounded-full flex-shrink-0 shadow-sm border border-black/10",
                style: { backgroundColor: subject.color }
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "flex-1 font-medium", children: subject.name }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => handleDeleteSubject(subject.id),
                className: "text-destructive hover:text-destructive hover:bg-destructive/10",
                children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
              }
            )
          ]
        },
        subject.id
      )) })
    ] })
  ] });
}
function Textarea({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      "data-slot": "textarea",
      className: cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      ),
      ...props
    }
  );
}
function Dialog({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive.Root, { "data-slot": "dialog", ...props });
}
function DialogTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive.Trigger, { "data-slot": "dialog-trigger", ...props });
}
function DialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive.Portal, { "data-slot": "dialog-portal", ...props });
}
function DialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Overlay,
    {
      "data-slot": "dialog-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      ),
      ...props
    }
  );
}
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  return /* @__PURE__ */ jsxs(DialogPortal, { "data-slot": "dialog-portal", children: [
    /* @__PURE__ */ jsx(DialogOverlay, {}),
    /* @__PURE__ */ jsxs(
      DialogPrimitive.Content,
      {
        "data-slot": "dialog-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        ),
        ...props,
        children: [
          children,
          showCloseButton && /* @__PURE__ */ jsxs(
            DialogPrimitive.Close,
            {
              "data-slot": "dialog-close",
              className: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              children: [
                /* @__PURE__ */ jsx(XIcon, {}),
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
              ]
            }
          )
        ]
      }
    )
  ] });
}
function DialogHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-header",
      className: cn("flex flex-col gap-2 text-center sm:text-left", className),
      ...props
    }
  );
}
function DialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Title,
    {
      "data-slot": "dialog-title",
      className: cn("text-lg leading-none font-semibold", className),
      ...props
    }
  );
}
function DialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Description,
    {
      "data-slot": "dialog-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function Label({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    LabelPrimitive.Root,
    {
      "data-slot": "label",
      className: cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
const DOUBLE_PERIOD_LABELS = {
  1: "1./2.",
  2: "1./2.",
  3: "3./4.",
  4: "3./4.",
  5: "5./6.",
  6: "5./6.",
  7: "7./8.",
  8: "7./8.",
  9: "9./10.",
  10: "9./10."
};
function DailyTracker({ date, subjects, evaluationTypes, onNavigateToSchedule }) {
  const [entries, setEntries] = useState([]);
  const [dayNotes, setDayNotes] = useState({});
  const [isReadOnly] = useState(() => isPastDate(date));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [todaySubjects, setTodaySubjects] = useState([]);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [weekSettings, setWeekSettings] = useState(null);
  const [currentWeekType, setCurrentWeekType] = useState("A");
  useEffect(() => {
    loadData();
  }, [date, subjects]);
  const loadData = async () => {
    try {
      const db = await getDB();
      const [loadedEntries, loadedSlots, settings] = await Promise.all([
        db.getEntriesForDate(date),
        db.getScheduleSlots(),
        db.getWeekSystemSettings()
      ]);
      setEntries(loadedEntries);
      setScheduleSlots(loadedSlots);
      setHasSchedule(loadedSlots.length > 0);
      setWeekSettings(settings);
      const dateObj2 = parseDate(date);
      const dayOfWeek2 = getDayOfWeek(dateObj2);
      let weekType = "A";
      if (settings?.enabled && settings.referenceDate) {
        weekType = getCurrentWeekType(dateObj2, settings.referenceDate);
        setCurrentWeekType(weekType);
      }
      if (dayOfWeek2 === -1) {
        setTodaySubjects([]);
      } else if (loadedSlots.length === 0) {
        setTodaySubjects([]);
      } else {
        const todaySlots = loadedSlots.filter((slot) => {
          if (slot.dayOfWeek !== dayOfWeek2) return false;
          if (settings?.enabled) {
            return slot.weekType === weekType;
          }
          return !slot.weekType || slot.weekType === null;
        });
        const seenPeriods = /* @__PURE__ */ new Set();
        const uniqueSlots = [];
        todaySlots.forEach((slot) => {
          const periodLabel = DOUBLE_PERIOD_LABELS[slot.period];
          const key = `${slot.subjectId}-${periodLabel}`;
          if (!seenPeriods.has(key)) {
            seenPeriods.add(key);
            const subject = subjects.find((s) => s.id === slot.subjectId);
            if (subject) {
              uniqueSlots.push({
                subject,
                periodLabel,
                firstPeriod: slot.period % 2 === 1 ? slot.period : slot.period - 1
              });
            }
          }
        });
        uniqueSlots.sort((a, b) => a.firstPeriod - b.firstPeriod);
        setTodaySubjects(uniqueSlots.map(({ subject, periodLabel }) => ({ subject, periodLabel })));
      }
      const notes = {};
      for (const subject of subjects) {
        const dayNote = await db.getDayNote(date, subject.id);
        if (dayNote) {
          notes[subject.id] = dayNote.note;
        }
      }
      setDayNotes(notes);
    } catch (error) {
      console.error("[calendar+] Failed to load entries:", error);
    }
  };
  const handleAddEntry = async (subjectId, evaluationTypeId, note) => {
    if (isReadOnly) return;
    try {
      const db = await getDB();
      await db.addEntry({
        subjectId,
        date,
        evaluationTypeId,
        note
      });
      await loadData();
      setAddDialogOpen(false);
    } catch (error) {
      console.error("[calendar+] Failed to add entry:", error);
    }
  };
  const handleDeleteEntry = async (id) => {
    if (isReadOnly) return;
    try {
      const db = await getDB();
      await db.deleteEntry(id);
      await loadData();
    } catch (error) {
      console.error("[calendar+] Failed to delete entry:", error);
    }
  };
  const handleSaveDayNote = async (subjectId, note) => {
    if (isReadOnly) return;
    try {
      const db = await getDB();
      await db.saveDayNote({ subjectId, date, note });
      setDayNotes((prev) => ({ ...prev, [subjectId]: note }));
    } catch (error) {
      console.error("[calendar+] Failed to save day note:", error);
    }
  };
  const getSubjectEntries = (subjectId) => {
    return entries.filter((entry) => entry.subjectId === subjectId);
  };
  const getEvaluationTypeName = (id) => {
    return evaluationTypes.find((et) => et.id === id)?.name || "Unbekannt";
  };
  const getEvaluationTypeColor = (id) => {
    return evaluationTypes.find((et) => et.id === id)?.color || "#6b7280";
  };
  const dateObj = parseDate(date);
  const dayOfWeek = getDayOfWeek(dateObj);
  const isWeekend = dayOfWeek === -1;
  if (isWeekend) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 text-center", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-8 w-8 text-muted-foreground" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Wochenende - kein Unterricht" })
    ] }) }) });
  }
  if (subjects.length === 0) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12", children: /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground", children: 'Erstelle zuerst Fächer im Tab "Fächer", um mit der Erfassung zu beginnen.' }) }) });
  }
  if (!hasSchedule) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4 text-center", children: [
      /* @__PURE__ */ jsx(Calendar, { className: "h-12 w-12 text-muted-foreground" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Kein Stundenplan eingerichtet" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Trage zuerst deinen Stundenplan ein, um die heutigen Fächer zu sehen." })
      ] }),
      onNavigateToSchedule && /* @__PURE__ */ jsx(Button, { onClick: onNavigateToSchedule, className: "mt-2", children: "Zum Stundenplan" })
    ] }) }) });
  }
  if (todaySubjects.length === 0) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4 text-center", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-8 w-8 text-muted-foreground" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Keine Fächer für heute" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Für diesen Tag sind keine Fächer im Stundenplan eingetragen." })
      ] }),
      onNavigateToSchedule && /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onNavigateToSchedule, className: "mt-2 bg-transparent", children: "Stundenplan bearbeiten" })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    isReadOnly && /* @__PURE__ */ jsxs("div", { className: "bg-muted border rounded-lg p-4 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5 text-muted-foreground" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Dieser Tag liegt in der Vergangenheit und kann nicht mehr bearbeitet werden." })
    ] }),
    todaySubjects.map(({ subject, periodLabel }) => {
      const subjectEntries = getSubjectEntries(subject.id);
      const totalCount = subjectEntries.length;
      return /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-w-[48px] h-10 rounded-lg bg-muted text-sm font-bold", children: periodLabel }),
            /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full flex-shrink-0", style: { backgroundColor: subject.color } }),
            /* @__PURE__ */ jsx(CardTitle, { className: "text-base sm:text-lg truncate", children: subject.name }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full flex-shrink-0", children: /* @__PURE__ */ jsx("span", { className: "text-base font-bold", children: totalCount }) })
          ] }),
          !isReadOnly && /* @__PURE__ */ jsxs(
            Dialog,
            {
              open: addDialogOpen && selectedSubject?.id === subject.id,
              onOpenChange: (open) => {
                setAddDialogOpen(open);
                if (open) setSelectedSubject(subject);
              },
              children: [
                /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", className: "gap-1.5 flex-shrink-0", children: [
                  /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Meldung" })
                ] }) }),
                /* @__PURE__ */ jsxs(DialogContent, { children: [
                  /* @__PURE__ */ jsxs(DialogHeader, { children: [
                    /* @__PURE__ */ jsxs(DialogTitle, { children: [
                      "Neue Meldung für ",
                      subject.name
                    ] }),
                    /* @__PURE__ */ jsx(DialogDescription, { children: "Wähle die Bewertung für diese mündliche Beteiligung" })
                  ] }),
                  /* @__PURE__ */ jsx(AddEntryForm, { subject, evaluationTypes, onAdd: handleAddEntry })
                ] })
              ]
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: subjectEntries.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "Noch keine Meldungen" }) : /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: subjectEntries.map((entry, index) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium", children: index + 1 }),
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "w-3 h-3 rounded-full flex-shrink-0",
                    style: { backgroundColor: getEvaluationTypeColor(entry.evaluationTypeId) }
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: getEvaluationTypeName(entry.evaluationTypeId) }),
                  entry.note && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate mt-0.5", children: entry.note })
                ] }),
                !isReadOnly && /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "icon",
                    className: "h-8 w-8 opacity-50 hover:opacity-100",
                    onClick: () => handleDeleteEntry(entry.id),
                    children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                  }
                )
              ]
            },
            entry.id
          )) }) }),
          /* @__PURE__ */ jsxs("div", { className: "pt-3 border-t", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: `note-${subject.id}`, className: "text-sm font-medium mb-2 block", children: "Notiz zum Tag" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                id: `note-${subject.id}`,
                placeholder: "Optionale Notiz für diesen Tag...",
                value: dayNotes[subject.id] || "",
                onChange: (e) => setDayNotes((prev) => ({ ...prev, [subject.id]: e.target.value })),
                onBlur: () => handleSaveDayNote(subject.id, dayNotes[subject.id] || ""),
                disabled: isReadOnly,
                className: "min-h-[70px] resize-none text-sm"
              }
            )
          ] })
        ] })
      ] }, `${subject.id}-${periodLabel}`);
    })
  ] });
}
function AddEntryForm({ subject, evaluationTypes, onAdd }) {
  const [selectedEvalType, setSelectedEvalType] = useState("");
  const [note, setNote] = useState("");
  const handleSubmit = () => {
    if (!selectedEvalType) return;
    onAdd(subject.id, selectedEvalType, note.trim() || void 0);
    setSelectedEvalType("");
    setNote("");
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { children: "Bewertung" }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: evaluationTypes.map((evalType) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setSelectedEvalType(evalType.id),
          className: `flex items-center gap-3 p-3 rounded-lg border transition-all ${selectedEvalType === evalType.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent"}`,
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded-full flex-shrink-0", style: { backgroundColor: evalType.color } }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: evalType.name })
          ]
        },
        evalType.id
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "entry-note", children: "Notiz (optional)" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "entry-note",
          placeholder: "z.B. 'Pythagoras erklärt'",
          value: note,
          onChange: (e) => setNote(e.target.value)
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: handleSubmit, disabled: !selectedEvalType, className: "w-full", children: "Meldung hinzufügen" })
  ] });
}
function HistoricalView({ subjects, evaluationTypes }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadHistory();
  }, []);
  const loadHistory = async () => {
    try {
      const db = await getDB();
      const days = [];
      for (let i = 0; i < 30; i++) {
        const date = /* @__PURE__ */ new Date();
        date.setDate(date.getDate() - i);
        days.push(formatDate(date));
      }
      const historyData = [];
      for (const date of days) {
        const entries = await db.getEntriesForDate(date);
        if (entries.length > 0) {
          const bySubject = {};
          entries.forEach((entry) => {
            bySubject[entry.subjectId] = (bySubject[entry.subjectId] || 0) + 1;
          });
          historyData.push({
            date,
            entries,
            totalCount: entries.length,
            bySubject
          });
        }
      }
      setHistory(historyData);
    } catch (error) {
      console.error("[calendar+] Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const getSubjectName = (id) => {
    return subjects.find((s) => s.id === id)?.name || "Unbekannt";
  };
  const getSubjectColor = (id) => {
    return subjects.find((s) => s.id === id)?.color || "#6b7280";
  };
  const getEvaluationTypeColor = (id) => {
    return evaluationTypes.find((et) => et.id === id)?.color || "#6b7280";
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12", children: /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground", children: "Lade Verlauf..." }) }) });
  }
  if (history.length === 0) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(Calendar, { className: "h-12 w-12 mx-auto text-muted-foreground mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Noch keine historischen Daten vorhanden." }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: 'Erfasse Meldungen im Tab "Heute", um einen Verlauf aufzubauen.' })
    ] }) }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: history.map((day) => /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: formatDisplayDate(day.date) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold", children: [
        day.totalCount,
        " Meldungen"
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Object.entries(day.bySubject).map(([subjectId, count]) => {
      const subjectEntries = day.entries.filter((e) => e.subjectId === subjectId);
      return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: getSubjectColor(subjectId) } }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: getSubjectName(subjectId) }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
            "(",
            count,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 ml-5", children: subjectEntries.map((entry) => /* @__PURE__ */ jsx(
          "div",
          {
            className: "w-3 h-3 rounded-full",
            style: { backgroundColor: getEvaluationTypeColor(entry.evaluationTypeId) },
            title: entry.note
          },
          entry.id
        )) })
      ] }, subjectId);
    }) }) })
  ] }, day.date)) });
}
const PRESET_COLORS = [
  "#10b981",
  // green
  "#f59e0b",
  // amber
  "#ef4444",
  // red
  "#6b7280",
  // gray
  "#8b5cf6",
  // violet
  "#3b82f6",
  // blue
  "#ec4899",
  // pink
  "#14b8a6"
  // teal
];
function EvaluationManager({ evaluationTypes, onEvaluationTypesChange }) {
  const [newEvalName, setNewEvalName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const handleAddEvaluation = async () => {
    if (!newEvalName.trim()) return;
    try {
      const db = await getDB();
      await db.addEvaluationType({
        name: newEvalName.trim(),
        color: selectedColor,
        order: evaluationTypes.length
      });
      setNewEvalName("");
      onEvaluationTypesChange();
    } catch (error) {
      console.error("[calendar+] Failed to add evaluation type:", error);
    }
  };
  const handleDeleteEvaluation = async (id) => {
    if (!confirm("Bewertungstyp wirklich löschen? Bereits erfasste Einträge bleiben erhalten.")) return;
    try {
      const db = await getDB();
      await db.deleteEvaluationType(id);
      onEvaluationTypesChange();
    } catch (error) {
      console.error("[calendar+] Failed to delete evaluation type:", error);
    }
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Bewertungstypen verwalten" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Definiere Kategorien für die Bewertung mündlicher Beiträge" })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Neuer Bewertungstyp...",
              value: newEvalName,
              onChange: (e) => setNewEvalName(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && handleAddEvaluation(),
              className: "flex-1"
            }
          ),
          /* @__PURE__ */ jsx(Button, { onClick: handleAddEvaluation, size: "icon", children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground ml-1", children: "Farbe wählen" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "relative group", children: /* @__PURE__ */ jsxs(
              "div",
              {
                className: "w-10 h-10 rounded-md border shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110",
                style: { backgroundColor: selectedColor },
                children: [
                  /* @__PURE__ */ jsx(Paintbrush, { className: "h-4 w-4 text-white mix-blend-difference opacity-70" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "color",
                      value: selectedColor,
                      onChange: (e) => setSelectedColor(e.target.value),
                      className: "absolute inset-0 opacity-0 cursor-pointer w-full h-full",
                      title: "Eigene Farbe wählen"
                    }
                  )
                ]
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-border mx-1" }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-2 flex-wrap", children: PRESET_COLORS.map((color) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedColor(color),
                className: "w-8 h-8 rounded-md transition-transform hover:scale-110",
                style: {
                  backgroundColor: color,
                  border: selectedColor === color ? "2px solid currentColor" : "1px solid transparent",
                  outline: selectedColor === color ? "2px solid #000" : "none",
                  outlineOffset: "1px",
                  opacity: selectedColor === color ? 1 : 0.7
                },
                "aria-label": `Farbe ${color}`
              },
              color
            )) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: evaluationTypes.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground py-8", children: "Noch keine Bewertungstypen vorhanden." }) : evaluationTypes.map((evalType) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
          children: [
            /* @__PURE__ */ jsx(GripVertical, { className: "h-5 w-5 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-4 h-4 rounded-full flex-shrink-0 shadow-sm border border-black/10",
                style: { backgroundColor: evalType.color }
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "flex-1 font-medium", children: evalType.name }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => handleDeleteEvaluation(evalType.id),
                className: "text-destructive hover:text-destructive hover:bg-destructive/10",
                children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
              }
            )
          ]
        },
        evalType.id
      )) })
    ] })
  ] });
}
function Tabs({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Root,
    {
      "data-slot": "tabs",
      className: cn("flex flex-col gap-2", className),
      ...props
    }
  );
}
function TabsList({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.List,
    {
      "data-slot": "tabs-list",
      className: cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      ),
      ...props
    }
  );
}
function TabsTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Trigger,
    {
      "data-slot": "tabs-trigger",
      className: cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function TabsContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Content,
    {
      "data-slot": "tabs-content",
      className: cn("flex-1 outline-none", className),
      ...props
    }
  );
}
function GradeEntryDialog({ subject, evaluationTypes, onGradeAdded }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!grade || Number.parseFloat(grade) < 1 || Number.parseFloat(grade) > 6) {
      alert("Bitte geben Sie eine Note zwischen 1 und 6 ein");
      return;
    }
    setIsSubmitting(true);
    try {
      const db = await getDB();
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const allEntries = await new Promise((resolve, reject) => {
        const transaction = db["db"].transaction("entries", "readonly");
        const store = transaction.objectStore("entries");
        const request = store.getAll();
        request.onsuccess = () => {
          const all = request.result || [];
          const filtered = all.filter(
            (e) => e.subjectId === subject.id && new Date(e.date) >= thirtyDaysAgo && new Date(e.date) <= /* @__PURE__ */ new Date()
          );
          resolve(filtered);
        };
        request.onerror = () => reject(request.error);
      });
      const evalCounts = {};
      allEntries.forEach((entry) => {
        evalCounts[entry.evaluationTypeId] = (evalCounts[entry.evaluationTypeId] || 0) + 1;
      });
      await db.addGrade({
        subjectId: subject.id,
        grade: Number.parseFloat(grade),
        date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        evaluationCombination: JSON.stringify(evalCounts),
        note: note || void 0
      });
      setOpen(false);
      setGrade("");
      setNote("");
      onGradeAdded();
    } catch (error) {
      console.error("[calendar+] Failed to add grade:", error);
      alert("Fehler beim Speichern der Note");
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", children: [
      /* @__PURE__ */ jsx(PlusCircle, { className: "h-4 w-4 mr-2" }),
      "Note eintragen"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { children: [
          "Note eintragen für ",
          subject.name
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Die letzten 30 Tage an Meldungen werden mit dieser Note verknüpft" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "grade", children: "Note (0-15)" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "grade",
              type: "number",
              min: "0",
              max: "15",
              step: "0.1",
              value: grade,
              onChange: (e) => setGrade(e.target.value),
              placeholder: "z.B. 2.5"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "note", children: "Notiz (optional)" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              id: "note",
              value: note,
              onChange: (e) => setNote(e.target.value),
              placeholder: "Zusätzliche Informationen...",
              rows: 3
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Abbrechen" }),
        /* @__PURE__ */ jsx(Button, { onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? "Speichern..." : "Speichern" })
      ] })
    ] })
  ] });
}
function StatisticsView({ subjects, evaluationTypes }) {
  const [stats, setStats] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, [subjects]);
  const loadData = async () => {
    try {
      await Promise.all([loadStatistics(), loadGrades()]);
    } finally {
      setIsLoading(false);
    }
  };
  const loadStatistics = async () => {
    try {
      const db = await getDB();
      const subjectStats = [];
      let total = 0;
      for (const subject of subjects) {
        const entries = await getAllEntriesForSubject(subject.id);
        const evaluationCounts = {};
        entries.forEach((entry) => {
          evaluationCounts[entry.evaluationTypeId] = (evaluationCounts[entry.evaluationTypeId] || 0) + 1;
        });
        const lastEntry = entries.sort((a, b) => b.timestamp - a.timestamp)[0];
        subjectStats.push({
          subjectId: subject.id,
          totalEntries: entries.length,
          evaluationCounts,
          lastActivity: lastEntry?.date
        });
        total += entries.length;
      }
      setStats(subjectStats);
      setTotalEntries(total);
    } catch (error) {
      console.error("[calendar+] Failed to load statistics:", error);
    }
  };
  const loadGrades = async () => {
    try {
      const db = await getDB();
      const allGrades = await db.getGrades();
      setGrades(allGrades);
    } catch (error) {
      console.error("[calendar+] Failed to load grades:", error);
    }
  };
  const getAllEntriesForSubject = async (subjectId) => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db["db"].transaction("entries", "readonly");
      const store = transaction.objectStore("entries");
      const request = store.getAll();
      request.onsuccess = () => {
        const allEntries = request.result || [];
        const filtered = allEntries.filter((e) => e.subjectId === subjectId);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  };
  const getSubjectName = (id) => {
    return subjects.find((s) => s.id === id)?.name || "Unbekannt";
  };
  const getSubjectColor = (id) => {
    return subjects.find((s) => s.id === id)?.color || "#6b7280";
  };
  const getEvaluationTypeName = (id) => {
    return evaluationTypes.find((et) => et.id === id)?.name || "Unbekannt";
  };
  const getEvaluationTypeColor = (id) => {
    return evaluationTypes.find((et) => et.id === id)?.color || "#6b7280";
  };
  const getMostActiveSubject = () => {
    if (stats.length === 0) return null;
    return stats.reduce((prev, current) => prev.totalEntries > current.totalEntries ? prev : current);
  };
  const getAveragePerSubject = () => {
    if (subjects.length === 0) return 0;
    return (totalEntries / subjects.length).toFixed(1);
  };
  const getGradeCorrelations = (subjectId) => {
    return grades.filter((g) => g.subjectId === subjectId).map((g) => ({
      grade: g.grade,
      evaluationCounts: JSON.parse(g.evaluationCombination),
      count: 1,
      date: g.date,
      note: g.note
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  const getAverageGrade = (subjectId) => {
    const subjectGrades = grades.filter((g) => g.subjectId === subjectId);
    if (subjectGrades.length === 0) return "—";
    const avg = subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length;
    return avg.toFixed(2);
  };
  const mostActive = getMostActiveSubject();
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsx("div", { className: "inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" }) });
  }
  if (subjects.length === 0) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12", children: /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground", children: "Erstelle zuerst Fächer, um Statistiken anzuzeigen." }) }) });
  }
  return /* @__PURE__ */ jsxs(Tabs, { defaultValue: "overview", className: "w-full", children: [
    /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [
      /* @__PURE__ */ jsx(TabsTrigger, { value: "overview", children: "Übersicht" }),
      /* @__PURE__ */ jsx(TabsTrigger, { value: "grades", children: "Noten & Korrelationen" })
    ] }),
    /* @__PURE__ */ jsxs(TabsContent, { value: "overview", className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Gesamt Meldungen" }),
            /* @__PURE__ */ jsx(BarChart3, { className: "h-4 w-4 text-muted-foreground" })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: totalEntries }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Über alle Fächer" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Durchschnitt pro Fach" }),
            /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-muted-foreground" })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: getAveragePerSubject() }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Meldungen pro Fach" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Aktivstes Fach" }),
            /* @__PURE__ */ jsx(Award, { className: "h-4 w-4 text-muted-foreground" })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { children: mostActive && mostActive.totalEntries > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "w-3 h-3 rounded-full",
                  style: { backgroundColor: getSubjectColor(mostActive.subjectId) }
                }
              ),
              getSubjectName(mostActive.subjectId)
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
              mostActive.totalEntries,
              " Meldungen"
            ] })
          ] }) : null })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Statistiken pro Fach" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: stats.map((stat) => {
          const subject = subjects.find((s) => s.id === stat.subjectId);
          if (!subject) return null;
          return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded-full", style: { backgroundColor: subject.color } }),
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg", children: subject.name }),
                /* @__PURE__ */ jsx("div", { className: "bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold", children: stat.totalEntries })
              ] }),
              stat.lastActivity && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
                new Date(stat.lastActivity).toLocaleDateString("de-DE")
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: evaluationTypes.map((evalType) => {
              const count = stat.evaluationCounts[evalType.id] || 0;
              const percentage = stat.totalEntries > 0 ? count / stat.totalEntries * 100 : 0;
              return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: evalType.color } }),
                    /* @__PURE__ */ jsx("span", { children: evalType.name })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                    count,
                    " (",
                    percentage.toFixed(0),
                    "%)"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "w-full bg-muted rounded-full h-2", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "h-2 rounded-full transition-all",
                    style: {
                      width: `${percentage}%`,
                      backgroundColor: evalType.color
                    }
                  }
                ) })
              ] }, evalType.id);
            }) })
          ] }, stat.subjectId);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(TabsContent, { value: "grades", className: "space-y-6", children: /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Noten & Korrelationen" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Sehen Sie welche Meldungs-Kombinationen zu welchen Noten führen" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-6", children: subjects.map((subject) => {
        const correlations = getGradeCorrelations(subject.id);
        const avgGrade = getAverageGrade(subject.id);
        return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-4 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded-full", style: { backgroundColor: subject.color } }),
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg", children: subject.name }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsx(GraduationCap, { className: "h-4 w-4" }),
                "Ø ",
                avgGrade
              ] })
            ] }),
            /* @__PURE__ */ jsx(GradeEntryDialog, { subject, evaluationTypes, onGradeAdded: loadData })
          ] }),
          correlations.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Noch keine Noten eingetragen" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: correlations.map((corr, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 rounded-lg p-3 space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
                "Note: ",
                corr.grade.toFixed(1)
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: new Date(corr.date).toLocaleDateString("de-DE") })
            ] }) }),
            corr.note && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground italic", children: corr.note }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 text-sm", children: Object.entries(corr.evaluationCounts).map(([evalId, count]) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "w-3 h-3 rounded-full",
                  style: { backgroundColor: getEvaluationTypeColor(evalId) }
                }
              ),
              /* @__PURE__ */ jsxs("span", { children: [
                getEvaluationTypeName(evalId),
                ":"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: count })
            ] }, evalId)) })
          ] }, idx)) })
        ] }, subject.id);
      }) })
    ] }) })
  ] });
}
function Select({
  ...props
}) {
  return /* @__PURE__ */ jsx(SelectPrimitive.Root, { "data-slot": "select", ...props });
}
function SelectValue({
  ...props
}) {
  return /* @__PURE__ */ jsx(SelectPrimitive.Value, { "data-slot": "select-value", ...props });
}
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    SelectPrimitive.Trigger,
    {
      "data-slot": "select-trigger",
      "data-size": size,
      className: cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDownIcon, { className: "size-4 opacity-50" }) })
      ]
    }
  );
}
function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}) {
  return /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
    SelectPrimitive.Content,
    {
      "data-slot": "select-content",
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      ),
      position,
      ...props,
      children: [
        /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
        /* @__PURE__ */ jsx(
          SelectPrimitive.Viewport,
          {
            className: cn(
              "p-1",
              position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
            ),
            children
          }
        ),
        /* @__PURE__ */ jsx(SelectScrollDownButton, {})
      ]
    }
  ) });
}
function SelectItem({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    SelectPrimitive.Item,
    {
      "data-slot": "select-item",
      className: cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx("span", { className: "absolute right-2 flex size-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon, { className: "size-4" }) }) }),
        /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
      ]
    }
  );
}
function SelectScrollUpButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    SelectPrimitive.ScrollUpButton,
    {
      "data-slot": "select-scroll-up-button",
      className: cn(
        "flex cursor-default items-center justify-center py-1",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(ChevronUpIcon, { className: "size-4" })
    }
  );
}
function SelectScrollDownButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    SelectPrimitive.ScrollDownButton,
    {
      "data-slot": "select-scroll-down-button",
      className: cn(
        "flex cursor-default items-center justify-center py-1",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(ChevronDownIcon, { className: "size-4" })
    }
  );
}
function Switch({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    SwitchPrimitive.Root,
    {
      "data-slot": "switch",
      className: cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        SwitchPrimitive.Thumb,
        {
          "data-slot": "switch-thumb",
          className: "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        }
      )
    }
  );
}
function ScrollArea({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    ScrollAreaPrimitive.Root,
    {
      "data-slot": "scroll-area",
      className: cn("relative", className),
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          ScrollAreaPrimitive.Viewport,
          {
            "data-slot": "scroll-area-viewport",
            className: "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
            children
          }
        ),
        /* @__PURE__ */ jsx(ScrollBar, {}),
        /* @__PURE__ */ jsx(ScrollAreaPrimitive.Corner, {})
      ]
    }
  );
}
function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    ScrollAreaPrimitive.ScrollAreaScrollbar,
    {
      "data-slot": "scroll-area-scrollbar",
      orientation,
      className: cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        ScrollAreaPrimitive.ScrollAreaThumb,
        {
          "data-slot": "scroll-area-thumb",
          className: "bg-border relative flex-1 rounded-full"
        }
      )
    }
  );
}
function AlertDialog({
  ...props
}) {
  return /* @__PURE__ */ jsx(AlertDialogPrimitive.Root, { "data-slot": "alert-dialog", ...props });
}
function AlertDialogTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(AlertDialogPrimitive.Trigger, { "data-slot": "alert-dialog-trigger", ...props });
}
function AlertDialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx(AlertDialogPrimitive.Portal, { "data-slot": "alert-dialog-portal", ...props });
}
function AlertDialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Overlay,
    {
      "data-slot": "alert-dialog-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      ),
      ...props
    }
  );
}
function AlertDialogContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [
    /* @__PURE__ */ jsx(AlertDialogOverlay, {}),
    /* @__PURE__ */ jsx(
      AlertDialogPrimitive.Content,
      {
        "data-slot": "alert-dialog-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        ),
        ...props
      }
    )
  ] });
}
function AlertDialogHeader({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert-dialog-header",
      className: cn("flex flex-col gap-2 text-center sm:text-left", className),
      ...props
    }
  );
}
function AlertDialogFooter({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert-dialog-footer",
      className: cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props
    }
  );
}
function AlertDialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Title,
    {
      "data-slot": "alert-dialog-title",
      className: cn("text-lg font-semibold", className),
      ...props
    }
  );
}
function AlertDialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Description,
    {
      "data-slot": "alert-dialog-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function AlertDialogAction({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Action,
    {
      className: cn(buttonVariants(), className),
      ...props
    }
  );
}
function AlertDialogCancel({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Cancel,
    {
      className: cn(buttonVariants({ variant: "outline" }), className),
      ...props
    }
  );
}
const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
const DOUBLE_PERIODS = [
  { label: "1./2.", periods: [1, 2] },
  { label: "3./4.", periods: [3, 4] },
  { label: "5./6.", periods: [5, 6] },
  { label: "7./8.", periods: [7, 8] },
  { label: "9./10.", periods: [9, 10] }
];
function ScheduleEditor({ subjects, onScheduleChange }) {
  const [schedule, setSchedule] = useState([]);
  const [weekSettings, setWeekSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState("A");
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const db = await getDB();
      const [slots, settings] = await Promise.all([
        db.getScheduleSlots(),
        db.getWeekSystemSettings()
      ]);
      setSchedule(slots);
      setWeekSettings(settings);
    } catch (error) {
      console.error("[calendar+] Failed to load schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleToggleWeekSystem = async (enabled) => {
    try {
      const db = await getDB();
      const settings = {
        enabled,
        referenceDate: formatDate(/* @__PURE__ */ new Date())
      };
      await db.saveWeekSystemSettings(settings);
      await loadData();
      onScheduleChange?.();
    } catch (error) {
      console.error("[calendar+] Failed to toggle week system:", error);
    }
  };
  const handleReferenceDateChange = async (date) => {
    if (!weekSettings) return;
    try {
      const db = await getDB();
      await db.saveWeekSystemSettings({
        enabled: weekSettings.enabled,
        referenceDate: date
      });
      await loadData();
    } catch (error) {
      console.error("[calendar+] Failed to update reference date:", error);
    }
  };
  const handleAddSlot = async (dayOfWeek, doublePeriod, subjectId, weekType) => {
    try {
      const db = await getDB();
      for (const period of doublePeriod) {
        const existing = schedule.find(
          (s) => s.dayOfWeek === dayOfWeek && s.period === period && (weekSettings?.enabled ? s.weekType === weekType : true)
        );
        if (existing) {
          await db.deleteScheduleSlot(existing.id);
        }
      }
      for (const period of doublePeriod) {
        await db.addScheduleSlot({
          dayOfWeek,
          period,
          subjectId,
          weekType: weekSettings?.enabled ? weekType : null
        });
      }
      await loadData();
      onScheduleChange?.();
    } catch (error) {
      console.error("[calendar+] Failed to add schedule slot:", error);
    }
  };
  const handleRemoveSlot = async (dayOfWeek, doublePeriod, weekType) => {
    try {
      const db = await getDB();
      for (const period of doublePeriod) {
        const slot = schedule.find(
          (s) => s.dayOfWeek === dayOfWeek && s.period === period && (weekSettings?.enabled ? s.weekType === weekType : true)
        );
        if (slot) {
          await db.deleteScheduleSlot(slot.id);
        }
      }
      await loadData();
      onScheduleChange?.();
    } catch (error) {
      console.error("[calendar+] Failed to remove schedule slot:", error);
    }
  };
  const handleClearAll = async () => {
    try {
      const db = await getDB();
      await db.clearScheduleSlots();
      await loadData();
      onScheduleChange?.();
    } catch (error) {
      console.error("[calendar+] Failed to clear schedule:", error);
    }
  };
  const getSlotForDoublePeriod = (dayOfWeek, doublePeriod, weekType) => {
    return schedule.find(
      (s) => s.dayOfWeek === dayOfWeek && s.period === doublePeriod[0] && (weekSettings?.enabled ? s.weekType === weekType : !s.weekType || s.weekType === null)
    );
  };
  const getSubjectById = (subjectId) => {
    return subjects.find((s) => s.id === subjectId);
  };
  const renderScheduleGrid = (weekType) => /* @__PURE__ */ jsx(ScrollArea, { className: "w-full", children: /* @__PURE__ */ jsx("div", { className: "min-w-[600px] pb-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[70px_repeat(5,1fr)] gap-2", children: [
    /* @__PURE__ */ jsx("div", { className: "font-semibold text-xs p-2 text-muted-foreground", children: "Stunde" }),
    DAYS.map((day) => /* @__PURE__ */ jsxs("div", { className: "font-semibold text-xs sm:text-sm p-2 text-center bg-muted/50 rounded-lg", children: [
      /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: day }),
      /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: day.slice(0, 2) })
    ] }, day)),
    DOUBLE_PERIODS.map((dp) => /* @__PURE__ */ jsxs("div", { className: "contents", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center font-bold text-sm p-2 bg-muted rounded-lg", children: dp.label }),
      DAYS.map((_, dayIndex) => {
        const slot = getSlotForDoublePeriod(dayIndex, dp.periods, weekType);
        const subject = slot ? getSubjectById(slot.subjectId) : null;
        return /* @__PURE__ */ jsx("div", { className: "relative min-h-[60px]", children: slot && subject ? /* @__PURE__ */ jsxs(
          "div",
          {
            className: "h-full p-2 rounded-lg text-sm font-medium text-white flex items-center justify-between gap-1 shadow-sm",
            style: { backgroundColor: subject.color },
            children: [
              /* @__PURE__ */ jsx("span", { className: "truncate text-xs sm:text-sm", children: subject.name }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "h-6 w-6 hover:bg-white/20 flex-shrink-0",
                  onClick: () => handleRemoveSlot(dayIndex, dp.periods, weekType),
                  children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
                }
              )
            ]
          }
        ) : /* @__PURE__ */ jsxs(Select, { onValueChange: (value) => handleAddSlot(dayIndex, dp.periods, value, weekType), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-full min-h-[60px] text-xs border-dashed", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "+" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: subjects.map((subject2) => /* @__PURE__ */ jsx(SelectItem, { value: subject2.id, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded", style: { backgroundColor: subject2.color } }),
            subject2.name
          ] }) }, subject2.id)) })
        ] }) }, `${dayIndex}-${dp.label}`);
      })
    ] }, dp.label))
  ] }) }) });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "text-center py-8", children: "Lade Stundenplan..." });
  }
  if (subjects.length === 0) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 text-center", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-8 w-8 text-muted-foreground" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: 'Erstelle zuerst Fächer im Tab "Fächer", um den Stundenplan zu bearbeiten.' })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(CalendarDays, { className: "h-5 w-5" }),
          "A/B Wochensystem"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Aktiviere das A/B Wochensystem für einen sich wöchentlich abwechselnden Stundenplan" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "week-system-toggle", children: "A/B Wochensystem aktivieren" }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              id: "week-system-toggle",
              checked: weekSettings?.enabled || false,
              onCheckedChange: handleToggleWeekSystem
            }
          )
        ] }),
        weekSettings?.enabled && /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2 border-t", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "reference-date", children: "Referenzdatum (A-Woche)" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "reference-date",
              type: "date",
              value: weekSettings.referenceDate,
              onChange: (e) => handleReferenceDateChange(e.target.value)
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Wähle ein Datum, das in einer bekannten A-Woche liegt. Das System berechnet automatisch alle anderen Wochen." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Stundenplan" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Ordne deine Fächer den Doppelstunden zu" })
        ] }),
        /* @__PURE__ */ jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "destructive", size: "sm", className: "gap-2", children: [
            /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }),
            "Alles löschen"
          ] }) }),
          /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
            /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Stundenplan löschen?" }),
              /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Dies löscht alle Einträge im Stundenplan. Diese Aktion kann nicht rückgängig gemacht werden." })
            ] }),
            /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
              /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Abbrechen" }),
              /* @__PURE__ */ jsx(
                AlertDialogAction,
                {
                  onClick: handleClearAll,
                  className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                  children: "Löschen"
                }
              )
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: weekSettings?.enabled ? /* @__PURE__ */ jsxs(Tabs, { value: activeWeek, onValueChange: (value) => setActiveWeek(value), children: [
        /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-2 mb-4", children: [
          /* @__PURE__ */ jsx(TabsTrigger, { value: "A", children: "A-Woche" }),
          /* @__PURE__ */ jsx(TabsTrigger, { value: "B", children: "B-Woche" })
        ] }),
        /* @__PURE__ */ jsx(TabsContent, { value: "A", children: renderScheduleGrid("A") }),
        /* @__PURE__ */ jsx(TabsContent, { value: "B", children: renderScheduleGrid("B") })
      ] }) : renderScheduleGrid(null) })
    ] })
  ] });
}
function GradeReminder() {
  const [reminder, setReminder] = useState(null);
  const [frequencyInput, setFrequencyInput] = useState(7);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    loadReminder();
  }, []);
  useEffect(() => {
    if (enabled && reminder) {
      checkReminder();
    }
  }, [enabled, reminder]);
  const loadReminder = async () => {
    try {
      const db = await getDB();
      const data = await db.getGradeReminder();
      if (data) {
        setReminder(data);
        setFrequencyInput(data.frequency);
        setEnabled(data.enabled);
      }
    } catch (error) {
      console.error("[calendar+] Failed to load reminder:", error);
    }
  };
  const checkReminder = () => {
    if (!reminder || !enabled) return;
    const now = Date.now();
    if (now >= reminder.nextReminder) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Noten eintragen", {
          body: "Vergessen Sie nicht, den Lehrer nach Ihren Noten zu fragen!",
          icon: "/favicon.ico"
        });
      } else {
        alert("Vergessen Sie nicht, den Lehrer nach Ihren Noten zu fragen!");
      }
      saveReminder(enabled, reminder.frequency, now);
    }
  };
  const saveReminder = async (isEnabled, freq, lastShown) => {
    try {
      const db = await getDB();
      const now = lastShown || Date.now();
      const nextReminder = now + freq * 24 * 60 * 60 * 1e3;
      await db.saveGradeReminder({
        enabled: isEnabled,
        frequency: freq,
        lastShown: now,
        nextReminder
      });
      await loadReminder();
    } catch (error) {
      console.error("[calendar+] Failed to save reminder:", error);
    }
  };
  const handleToggle = async (checked) => {
    setEnabled(checked);
    if (checked && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    const validFreq = Number(frequencyInput) || 7;
    await saveReminder(checked, validFreq);
  };
  const handleInputChange = (value) => {
    setFrequencyInput(value);
  };
  const handleInputBlur = async () => {
    let val = Number(frequencyInput);
    if (!val || val < 1) val = 1;
    if (val > 30) val = 30;
    setFrequencyInput(val);
    await saveReminder(enabled, val);
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        enabled ? /* @__PURE__ */ jsx(Bell, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx(BellOff, { className: "h-5 w-5" }),
        "Noten-Erinnerung"
      ] }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Lassen Sie sich daran erinnern, den Lehrer nach Noten zu fragen" })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "reminder-toggle", children: "Erinnerung aktivieren" }),
        /* @__PURE__ */ jsx(Switch, { id: "reminder-toggle", checked: enabled, onCheckedChange: handleToggle })
      ] }),
      enabled && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "frequency", children: "Erinnerung alle (Tage)" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "frequency",
            type: "number",
            min: "1",
            max: "30",
            value: frequencyInput,
            onChange: (e) => handleInputChange(e.target.value),
            onBlur: handleInputBlur
          }
        )
      ] }),
      reminder && enabled && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
        "Nächste Erinnerung: ",
        new Date(reminder.nextReminder).toLocaleString("de-DE")
      ] })
    ] })
  ] });
}
function ParticipationTracker() {
  const [subjects, setSubjects] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [currentDate] = useState(() => formatDate(/* @__PURE__ */ new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("today");
  useEffect(() => {
    async function loadData() {
      try {
        const db = await getDB();
        const [loadedSubjects, loadedEvalTypes] = await Promise.all([db.getSubjects(), db.getEvaluationTypes()]);
        setSubjects(loadedSubjects);
        setEvaluationTypes(loadedEvalTypes);
      } catch (error) {
        console.error("[calendar+] Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);
  const refreshSubjects = async () => {
    const db = await getDB();
    const updated = await db.getSubjects();
    setSubjects(updated);
  };
  const refreshEvaluationTypes = async () => {
    const db = await getDB();
    const updated = await db.getEvaluationTypes();
    setEvaluationTypes(updated);
  };
  const handleNavigateToSchedule = () => {
    setActiveTab("schedule");
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground font-medium", children: "Lade Daten..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [
    /* @__PURE__ */ jsx(Header, { currentDate }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl", children: /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-3 lg:grid-cols-6 gap-1 h-auto mb-4 sm:mb-6", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "today", className: "flex-col gap-1 py-2", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Heute" })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "statistics", className: "flex-col gap-1 py-2", children: [
          /* @__PURE__ */ jsx(BarChart3, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Statistik" })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "history", className: "flex-col gap-1 py-2", children: [
          /* @__PURE__ */ jsx(History, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Verlauf" })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "schedule", className: "flex-col gap-1 py-2", children: [
          /* @__PURE__ */ jsx(LayoutGrid, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Plan" })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "subjects", className: "flex-col gap-1 py-2", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Fächer" })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "settings", className: "flex-col gap-1 py-2", children: [
          /* @__PURE__ */ jsx(Settings, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Einstellungen" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "today", className: "space-y-4", children: /* @__PURE__ */ jsx(
        DailyTracker,
        {
          date: currentDate,
          subjects,
          evaluationTypes,
          onNavigateToSchedule: handleNavigateToSchedule
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "statistics", className: "space-y-4", children: /* @__PURE__ */ jsx(StatisticsView, { subjects, evaluationTypes }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "history", className: "space-y-4", children: /* @__PURE__ */ jsx(HistoricalView, { subjects, evaluationTypes }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "schedule", className: "space-y-4", children: /* @__PURE__ */ jsx(ScheduleEditor, { subjects }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "subjects", className: "space-y-4", children: /* @__PURE__ */ jsx(SubjectManager, { subjects, onSubjectsChange: refreshSubjects }) }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "settings", className: "space-y-4", children: [
        /* @__PURE__ */ jsx(GradeReminder, {}),
        /* @__PURE__ */ jsx(EvaluationManager, { evaluationTypes, onEvaluationTypesChange: refreshEvaluationTypes })
      ] })
    ] }) })
  ] });
}
function Home() {
  return /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsx(ParticipationTracker, {}) });
}
export {
  Home as component
};
