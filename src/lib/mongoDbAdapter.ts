import { getDb } from "./mongodb";
import { ObjectId, Document, Filter, Sort } from "mongodb";

export type QueryValue =
  | string
  | number
  | boolean
  | Date
  | ObjectId
  | { [key: string]: unknown }
  | QueryValue[];

// Helper to sanitize / format documents
function formatDoc<T>(doc: Document | null | undefined): T {
  if (!doc) return doc as unknown as T;
  const { _id, ...rest } = doc;
  return {
    id: _id ? _id.toString() : undefined,
    ...rest,
  } as unknown as T;
}

function toObjectId(id: unknown): ObjectId | unknown {
  if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
    return new ObjectId(id);
  }
  return id;
}

function buildQuery(query?: Record<string, unknown>): Filter<Document> {
  if (!query) return {};
  const out: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(query)) {
    if (key.includes("_") && val && typeof val === "object" && !(val instanceof Date) && !Array.isArray(val)) {
      const isOperatorObj = ["in", "notIn", "gte", "gt", "lte", "lt", "not", "equals", "contains"].some(k => k in val);
      if (!isOperatorObj) {
        for (const [subKey, subVal] of Object.entries(val as Record<string, unknown>)) {
          out[subKey] = subVal instanceof Date ? subVal : (subKey === "id" ? toObjectId(subVal) : subVal);
        }
        continue;
      }
    }

    if (key === "id") {
      if (typeof val === "object" && val !== null) {
        const valObj = val as Record<string, unknown>;
        if ("in" in valObj && Array.isArray(valObj.in)) {
          out._id = { $in: valObj.in.map((i: unknown) => toObjectId(i)) };
        } else if ("notIn" in valObj && Array.isArray(valObj.notIn)) {
          out._id = { $nin: valObj.notIn.map((i: unknown) => toObjectId(i)) };
        } else {
          out._id = val;
        }
      } else {
        out._id = toObjectId(val);
      }
    } else if (key === "OR" && Array.isArray(val)) {
      out.$or = val.map(v => buildQuery(v as Record<string, unknown>));
    } else if (key === "AND" && Array.isArray(val)) {
      out.$and = val.map(v => buildQuery(v as Record<string, unknown>));
    } else if (key === "NOT") {
      out.$nor = Array.isArray(val)
        ? val.map(v => buildQuery(v as Record<string, unknown>))
        : [buildQuery(val as Record<string, unknown>)];
    } else if (val && typeof val === "object" && !(val instanceof Date)) {
      const valObj = val as Record<string, unknown>;
      const fieldOps: Record<string, unknown> = {};
      if ("contains" in valObj) {
        fieldOps.$regex = valObj.contains;
        fieldOps.$options = "i";
      }
      if ("in" in valObj) fieldOps.$in = valObj.in;
      if ("notIn" in valObj) fieldOps.$nin = valObj.notIn;
      if ("gte" in valObj) fieldOps.$gte = valObj.gte;
      if ("gt" in valObj) fieldOps.$gt = valObj.gt;
      if ("lte" in valObj) fieldOps.$lte = valObj.lte;
      if ("lt" in valObj) fieldOps.$lt = valObj.lt;
      if ("not" in valObj) fieldOps.$ne = valObj.not;
      if ("equals" in valObj) fieldOps.$eq = valObj.equals;
      
      out[key] = Object.keys(fieldOps).length > 0 ? fieldOps : val;
    } else {
      out[key] = val;
    }
  }

  return out as Filter<Document>;
}

export interface ModelFindArgs {
  where?: Record<string, unknown>;
  orderBy?: unknown;
  skip?: number;
  take?: number;
  select?: Record<string, boolean>;
  include?: unknown;
}

export function createModel<T = Record<string, unknown>>(
  collectionName: string,
  relationResolver?: (doc: T, include: Record<string, unknown>) => Promise<T>
) {
  const getCol = async () => {
    const db = await getDb();
    return db.collection(collectionName);
  };

  return {
    findMany: async (args: ModelFindArgs = {}): Promise<T[]> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      let cursor = col.find(query);

      if (args.orderBy) {
        const sort: Record<string, 1 | -1> = {};
        if (Array.isArray(args.orderBy)) {
          for (const item of args.orderBy) {
            for (const [k, v] of Object.entries(item as Record<string, string>)) {
              sort[k] = v === "asc" ? 1 : -1;
            }
          }
        } else {
          for (const [k, v] of Object.entries(args.orderBy as Record<string, string>)) {
            sort[k] = v === "asc" ? 1 : -1;
          }
        }
        cursor = cursor.sort(sort as Sort);
      }

      if (args.skip) cursor = cursor.skip(args.skip);
      if (args.take) cursor = cursor.limit(args.take);

      const docs = await cursor.toArray();
      const formatted = docs.map(doc => formatDoc<T>(doc));

      if (relationResolver && args.include) {
        return Promise.all(formatted.map(doc => relationResolver(doc, args.include as Record<string, unknown>)));
      }
      return formatted;
    },

    findUnique: async (args: { where: Record<string, unknown>; include?: unknown; select?: Record<string, boolean> }): Promise<T | null> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const doc = await col.findOne(query);
      if (!doc) return null;
      const formatted = formatDoc<T>(doc);
      if (relationResolver && args.include) {
        return relationResolver(formatted, args.include as Record<string, unknown>);
      }
      return formatted;
    },

    findFirst: async (args: ModelFindArgs = {}): Promise<T | null> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      let cursor = col.find(query);

      if (args.orderBy) {
        const sort: Record<string, 1 | -1> = {};
        if (Array.isArray(args.orderBy)) {
          for (const item of args.orderBy) {
            for (const [k, v] of Object.entries(item as Record<string, string>)) {
              sort[k] = v === "asc" ? 1 : -1;
            }
          }
        } else {
          for (const [k, v] of Object.entries(args.orderBy as Record<string, string>)) {
            sort[k] = v === "asc" ? 1 : -1;
          }
        }
        cursor = cursor.sort(sort as Sort);
      }

      const doc = await cursor.limit(1).next();
      if (!doc) return null;
      const formatted = formatDoc<T>(doc);
      if (relationResolver && args.include) {
        return relationResolver(formatted, args.include as Record<string, unknown>);
      }
      return formatted;
    },

    create: async (args: { data: Record<string, unknown>; include?: Record<string, unknown>; select?: Record<string, boolean> }): Promise<T> => {
      const col = await getCol();
      const now = new Date();
      const docToInsert: Record<string, unknown> = {
        ...args.data,
        createdAt: args.data.createdAt || now,
        updatedAt: args.data.updatedAt || now,
      };
      const res = await col.insertOne(docToInsert as Document);
      return formatDoc<T>({ _id: res.insertedId, ...docToInsert });
    },

    createMany: async (args: { data: Record<string, unknown>[] }): Promise<{ count: number }> => {
      const col = await getCol();
      const now = new Date();
      const docs = args.data.map(d => ({
        ...d,
        createdAt: d.createdAt || now,
        updatedAt: d.updatedAt || now,
      }));
      const res = await col.insertMany(docs as Document[]);
      return { count: res.insertedCount };
    },

    update: async (args: { where: Record<string, unknown>; data: Record<string, unknown>; include?: Record<string, unknown>; select?: Record<string, boolean> }): Promise<T> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const updateData = { ...args.data, updatedAt: new Date() };

      const res = await col.findOneAndUpdate(
        query,
        { $set: updateData },
        { returnDocument: "after" }
      );
      if (!res) throw new Error(`Record not found in ${collectionName}`);
      return formatDoc<T>(res);
    },

    upsert: async (args: { where: Record<string, unknown>; update: Record<string, unknown>; create: Record<string, unknown>; include?: Record<string, unknown> }): Promise<T> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const existing = await col.findOne(query);
      if (existing) {
        const updateData = { ...args.update, updatedAt: new Date() };
        const res = await col.findOneAndUpdate(query, { $set: updateData }, { returnDocument: "after" });
        return formatDoc<T>(res);
      } else {
        const now = new Date();
        const docToInsert: Record<string, unknown> = {
          ...args.create,
          createdAt: args.create.createdAt || now,
          updatedAt: args.create.updatedAt || now,
        };
        const res = await col.insertOne(docToInsert as Document);
        return formatDoc<T>({ _id: res.insertedId, ...docToInsert });
      }
    },

    updateMany: async (args: { where?: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const res = await col.updateMany(query, { $set: { ...args.data, updatedAt: new Date() } });
      return { count: res.modifiedCount };
    },

    delete: async (args: { where: Record<string, unknown> }): Promise<T> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const doc = await col.findOneAndDelete(query);
      if (!doc) throw new Error(`Record not found for delete in ${collectionName}`);
      return formatDoc<T>(doc);
    },

    deleteMany: async (args: { where?: Record<string, unknown> } = {}): Promise<{ count: number }> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const res = await col.deleteMany(query);
      return { count: res.deletedCount };
    },

    count: async (args: { where?: Record<string, unknown> } = {}): Promise<number> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      return col.countDocuments(query);
    },

    aggregate: async (args: {
      where?: Record<string, unknown>;
      _sum?: Record<string, boolean>;
      _avg?: Record<string, boolean>;
      _min?: Record<string, boolean>;
      _max?: Record<string, boolean>;
    } | Document[]): Promise<Record<string, unknown>> => {
      const col = await getCol();
      if (Array.isArray(args)) {
        return (await col.aggregate(args).toArray()) as unknown as Record<string, unknown>;
      }

      const match = buildQuery(args.where);
      const groupStage: Record<string, unknown> = { _id: null };
      const sumKeys = Object.keys(args._sum || {});
      const avgKeys = Object.keys(args._avg || {});
      const minKeys = Object.keys(args._min || {});
      const maxKeys = Object.keys(args._max || {});

      for (const k of sumKeys) groupStage[`sum_${k}`] = { $sum: `$${k}` };
      for (const k of avgKeys) groupStage[`avg_${k}`] = { $avg: `$${k}` };
      for (const k of minKeys) groupStage[`min_${k}`] = { $min: `$${k}` };
      for (const k of maxKeys) groupStage[`max_${k}`] = { $max: `$${k}` };

      const pipeline: Document[] = [];
      if (Object.keys(match).length > 0) pipeline.push({ $match: match });
      pipeline.push({ $group: groupStage as Document });

      const results = await col.aggregate(pipeline).toArray();
      const first = results[0] || {};

      const _sum: Record<string, number> = {};
      const _avg: Record<string, number> = {};
      const _min: Record<string, unknown> = {};
      const _max: Record<string, unknown> = {};

      for (const k of sumKeys) _sum[k] = (first[`sum_${k}`] as number) || 0;
      for (const k of avgKeys) _avg[k] = (first[`avg_${k}`] as number) || 0;
      for (const k of minKeys) _min[k] = first[`min_${k}`] || null;
      for (const k of maxKeys) _max[k] = first[`max_${k}`] || null;

      return {
        _sum,
        _avg,
        _min,
        _max,
        _count: results.length > 0 ? (await col.countDocuments(match)) : 0,
      };
    },

    groupBy: async (args: {
      by: string[];
      where?: Record<string, unknown>;
      _count?: Record<string, boolean>;
      _sum?: Record<string, boolean>;
      _avg?: Record<string, boolean>;
    }): Promise<Record<string, unknown>[]> => {
      const col = await getCol();
      const match = buildQuery(args.where);
      const groupStage: Record<string, unknown> = { _id: {} };
      const groupStageId = groupStage._id as Record<string, string>;
      for (const field of args.by) {
        groupStageId[field] = `$${field}`;
      }

      if (args._count) {
        groupStage.count_id = { $sum: 1 };
      }

      const sumKeys = Object.keys(args._sum || {});
      for (const k of sumKeys) groupStage[`sum_${k}`] = { $sum: `$${k}` };

      const pipeline: Document[] = [];
      if (Object.keys(match).length > 0) pipeline.push({ $match: match });
      pipeline.push({ $group: groupStage as Document });

      const results = await col.aggregate(pipeline).toArray();
      return results.map(row => {
        const item: Record<string, unknown> = { ...(row._id as Record<string, unknown>) };
        if (args._count) {
          item._count = { id: row.count_id || 0, _all: row.count_id || 0 };
        }
        if (args._sum) {
          const sumObj: Record<string, number> = {};
          for (const k of sumKeys) sumObj[k] = (row[`sum_${k}`] as number) || 0;
          item._sum = sumObj;
        }
        return item;
      });
    },
  };
}
