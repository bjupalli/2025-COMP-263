use("Lab2");

const pad2 = (n) => String(n).padStart(2, "0");
const uuid = () =>
  ["8","4","4","12"]
    .map(n => Array.from({ length: +n }, () => 0)
      .map(() => Math.floor(Math.random()*16).toString(16)).join(""))
    .reduce((a, seg, i) => a + (i ? "-" : "") + seg, "");

const author = "Rohan Jagdish Tilwani";
const meta = { author, last_sync: new Date().toISOString(), uuid_source: uuid() };

const docs =
  Array.from({ length: 10 }, (_, i) => i + 1)
    .map(id => ({
      id,
      sensorId: `S-${pad2(id)}`,
      reading: Number((17.5 + id * 0.73).toFixed(2)),
      timestamp: new Date(Date.UTC(2025, 8, id, 12, 0, 0)).toISOString(),
      notes: `seeded #${id}`
    }))
    .filter(d => d.id >= 1 && d.id <= 10)
    .map(d => ({ ...d, metadata: meta }));

db.Agriculture.deleteMany({ "metadata.author": author });
db.Agriculture.insertMany(docs, { ordered: true });
db.Agriculture.countDocuments({ "metadata.author": author });
