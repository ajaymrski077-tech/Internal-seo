import { getDb } from "./mongodb";
import { ObjectId } from "mongodb";

// Helper to sanitize / format documents
function formatDoc<T>(doc: any): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
  } as T;
}

function toObjectId(id: string | number): ObjectId | string | number {
  if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
    return new ObjectId(id);
  }
  return id;
}

function buildQuery(query: any): any {
  if (!query) return {};
  const out: any = {};

  for (const [key, val] of Object.entries(query)) {
    if (key.includes("_") && val && typeof val === "object" && !(val instanceof Date) && !Array.isArray(val)) {
      const isOperatorObj = ["in", "notIn", "gte", "gt", "lte", "lt", "not", "equals", "contains"].some(k => k in val);
      if (!isOperatorObj) {
        for (const [subKey, subVal] of Object.entries(val)) {
          out[subKey] = subVal instanceof Date ? subVal : (subKey === "id" ? toObjectId(subVal as any) : subVal);
        }
        continue;
      }
    }

    if (key === "id") {
      if (typeof val === "object" && val !== null) {
        if ("in" in val && Array.isArray((val as any).in)) {
          out._id = { $in: (val as any).in.map((i: any) => toObjectId(i)) };
        } else if ("notIn" in val && Array.isArray((val as any).notIn)) {
          out._id = { $nin: (val as any).notIn.map((i: any) => toObjectId(i)) };
        } else {
          out._id = val;
        }
      } else {
        out._id = toObjectId(val as any);
      }
    } else if (key === "OR" && Array.isArray(val)) {
      out.$or = val.map(v => buildQuery(v));
    } else if (key === "AND" && Array.isArray(val)) {
      out.$and = val.map(v => buildQuery(v));
    } else if (key === "NOT") {
      out.$nor = Array.isArray(val) ? val.map(v => buildQuery(v)) : [buildQuery(val)];
    } else if (val && typeof val === "object" && !(val instanceof Date)) {
      const fieldOps: any = {};
      if ("contains" in val) {
        fieldOps.$regex = (val as any).contains;
        fieldOps.$options = "i";
      }
      if ("in" in val) fieldOps.$in = (val as any).in;
      if ("notIn" in val) fieldOps.$nin = (val as any).notIn;
      if ("gte" in val) fieldOps.$gte = (val as any).gte;
      if ("gt" in val) fieldOps.$gt = (val as any).gt;
      if ("lte" in val) fieldOps.$lte = (val as any).lte;
      if ("lt" in val) fieldOps.$lt = (val as any).lt;
      if ("not" in val) fieldOps.$ne = (val as any).not;
      if ("equals" in val) fieldOps.$eq = (val as any).equals;
      
      out[key] = Object.keys(fieldOps).length > 0 ? fieldOps : val;
    } else {
      out[key] = val;
    }
  }

  return out;
}

export function createModel<T = any>(
  collectionName: string,
  relationResolver?: (doc: any, include: any) => Promise<any>
) {
  const getCol = async () => {
    const db = await getDb();
    return db.collection(collectionName);
  };

  return {
    findMany: async (args: {
      where?: any;
      orderBy?: any;
      skip?: number;
      take?: number;
      select?: any;
      include?: any;
    } = {}): Promise<T[]> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      let cursor = col.find(query);

      if (args.orderBy) {
        const sort: any = {};
        if (Array.isArray(args.orderBy)) {
          for (const item of args.orderBy) {
            for (const [k, v] of Object.entries(item)) {
              sort[k] = v === "asc" ? 1 : -1;
            }
          }
        } else {
          for (const [k, v] of Object.entries(args.orderBy)) {
            sort[k] = v === "asc" ? 1 : -1;
          }
        }
        cursor = cursor.sort(sort);
      }

      if (args.skip) cursor = cursor.skip(args.skip);
      if (args.take) cursor = cursor.limit(args.take);

      const docs = await cursor.toArray();
      const formatted = docs.map(doc => formatDoc<T>(doc));

      if (relationResolver && args.include) {
        return Promise.all(formatted.map(doc => relationResolver(doc, args.include)));
      }
      return formatted;
    },

    findUnique: async (args: { where: any; include?: any; select?: any }): Promise<T | null> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const doc = await col.findOne(query);
      if (!doc) return null;
      const formatted = formatDoc<T>(doc);
      if (relationResolver && args.include) {
        return relationResolver(formatted, args.include);
      }
      return formatted;
    },

    findFirst: async (args: { where?: any; orderBy?: any; include?: any; select?: any } = {}): Promise<T | null> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      let cursor = col.find(query);

      if (args.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "asc" ? 1 : -1;
        }
        cursor = cursor.sort(sort);
      }

      const doc = await cursor.limit(1).next();
      if (!doc) return null;
      const formatted = formatDoc<T>(doc);
      if (relationResolver && args.include) {
        return relationResolver(formatted, args.include);
      }
      return formatted;
    },

    create: async (args: { data: any; include?: any; select?: any }): Promise<T> => {
      const col = await getCol();
      const now = new Date();
      const docToInsert = {
        ...args.data,
        createdAt: args.data.createdAt || now,
        updatedAt: args.data.updatedAt || now,
      };
      const res = await col.insertOne(docToInsert);
      return formatDoc<T>({ _id: res.insertedId, ...docToInsert });
    },

    createMany: async (args: { data: any[] }): Promise<{ count: number }> => {
      const col = await getCol();
      const now = new Date();
      const docs = args.data.map(d => ({
        ...d,
        createdAt: d.createdAt || now,
        updatedAt: d.updatedAt || now,
      }));
      const res = await col.insertMany(docs);
      return { count: res.insertedCount };
    },

    update: async (args: { where: any; data: any; include?: any; select?: any }): Promise<T> => {
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

    upsert: async (args: { where: any; update: any; create: any; include?: any }): Promise<T> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const existing = await col.findOne(query);
      if (existing) {
        const updateData = { ...args.update, updatedAt: new Date() };
        const res = await col.findOneAndUpdate(query, { $set: updateData }, { returnDocument: "after" });
        return formatDoc<T>(res);
      } else {
        const now = new Date();
        const docToInsert = {
          ...args.create,
          createdAt: args.create.createdAt || now,
          updatedAt: args.create.updatedAt || now,
        };
        const res = await col.insertOne(docToInsert);
        return formatDoc<T>({ _id: res.insertedId, ...docToInsert });
      }
    },

    updateMany: async (args: { where?: any; data: any }): Promise<{ count: number }> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const res = await col.updateMany(query, { $set: { ...args.data, updatedAt: new Date() } });
      return { count: res.modifiedCount };
    },

    delete: async (args: { where: any }): Promise<T> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const doc = await col.findOneAndDelete(query);
      if (!doc) throw new Error(`Record not found for delete in ${collectionName}`);
      return formatDoc<T>(doc);
    },

    deleteMany: async (args: { where?: any } = {}): Promise<{ count: number }> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      const res = await col.deleteMany(query);
      return { count: res.deletedCount };
    },

    count: async (args: { where?: any } = {}): Promise<number> => {
      const col = await getCol();
      const query = buildQuery(args.where);
      return col.countDocuments(query);
    },

    aggregate: async (args: any): Promise<any> => {
      const col = await getCol();
      if (Array.isArray(args)) {
        return col.aggregate(args).toArray();
      }

      const match = buildQuery(args.where);
      const groupStage: any = { _id: null };
      const sumKeys = Object.keys(args._sum || {});
      const avgKeys = Object.keys(args._avg || {});
      const minKeys = Object.keys(args._min || {});
      const maxKeys = Object.keys(args._max || {});

      for (const k of sumKeys) groupStage[`sum_${k}`] = { $sum: `$${k}` };
      for (const k of avgKeys) groupStage[`avg_${k}`] = { $avg: `$${k}` };
      for (const k of minKeys) groupStage[`min_${k}`] = { $min: `$${k}` };
      for (const k of maxKeys) groupStage[`max_${k}`] = { $max: `$${k}` };

      const pipeline: any[] = [];
      if (Object.keys(match).length > 0) pipeline.push({ $match: match });
      pipeline.push({ $group: groupStage });

      const results = await col.aggregate(pipeline).toArray();
      const first = results[0] || {};

      const _sum: any = {};
      const _avg: any = {};
      const _min: any = {};
      const _max: any = {};

      for (const k of sumKeys) _sum[k] = first[`sum_${k}`] || 0;
      for (const k of avgKeys) _avg[k] = first[`avg_${k}`] || 0;
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

    groupBy: async (args: { by: string[]; where?: any; _count?: any; _sum?: any; _avg?: any }): Promise<any[]> => {
      const col = await getCol();
      const match = buildQuery(args.where);
      const groupStage: any = { _id: {} };
      for (const field of args.by) {
        groupStage._id[field] = `$${field}`;
      }

      if (args._count) {
        groupStage.count_id = { $sum: 1 };
      }

      const sumKeys = Object.keys(args._sum || {});
      for (const k of sumKeys) groupStage[`sum_${k}`] = { $sum: `$${k}` };

      const pipeline: any[] = [];
      if (Object.keys(match).length > 0) pipeline.push({ $match: match });
      pipeline.push({ $group: groupStage });

      const results = await col.aggregate(pipeline).toArray();
      return results.map(row => {
        const item: any = { ...row._id };
        if (args._count) {
          item._count = { id: row.count_id || 0, _all: row.count_id || 0 };
        }
        if (args._sum) {
          item._sum = {};
          for (const k of sumKeys) item._sum[k] = row[`sum_${k}`] || 0;
        }
        return item;
      });
    },
  };
}
