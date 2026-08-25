import prisma from './src/lib/db';

const activeTickets = [
    { subject: "Cookie preferences not working", clientName: "EIN Search", fromName: "Anila", status: "in progress", priority: "high", assignedTo: "—" },
    { subject: "Correcting the Capital T to lower case in TINvalidation", clientName: "FIN Search", fromName: "Anila", status: "pending", priority: "low", assignedTo: "—" },
    { subject: "TinMatch Page Sample Search screenshot", clientName: "EIN Search", fromName: "Anila", status: "in progress", priority: "normal", assignedTo: "—" },
    { subject: "Changing date range for March report", clientName: "Datum", fromName: "Rana", status: "open", priority: "normal", assignedTo: "—" },
    { subject: "Page does not match remainder of site", clientName: "EIN Search", fromName: "Anila", status: "in progress", priority: "normal", assignedTo: "—" },
    { subject: "Research Pages", clientName: "EIN Search", fromName: "Anila", status: "in progress", priority: "normal", assignedTo: "—" },
    { subject: "Add Clinic Health Review", clientName: "FIN Search", fromName: "Anila", status: "in progress", priority: "normal", assignedTo: "MisterSK Infotech" }
];

const closedTickets = [
    { subject: "API on monthly plans is unclear. The API Access is greyed out, but he mentioned it may not be sufficient, and I agree. Maybe remove the check mark as well.", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "high", assignedTo: "—" },
    { subject: "Inaccurate row on compare every feature section of pricing page", clientName: "FIN Search", fromName: "Anila", status: "closed", priority: "high", assignedTo: "—" },
    { subject: "Brand Use Compliance", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "normal", assignedTo: "—" },
    { subject: "New Blog Impo", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "low", assignedTo: "—" },
    { subject: "Plans Page redirect location on TV", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "low", assignedTo: "—" },
    { subject: "TIN Validate Batch TIN Matching Page", clientName: "FIN Search", fromName: "Anila", status: "closed", priority: "normal", assignedTo: "—" },
    { subject: "WhitePaper Form Edits", clientName: "FIN Search", fromName: "Anila", status: "closed", priority: "normal", assignedTo: "MisterSK Infotech" },
    { subject: "TV Pricing Page", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "low", assignedTo: "—" },
    { subject: "Cookie pop-up Spelling fix", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "high", assignedTo: "—" },
    { subject: "TINvalidate - Batch TIN match page", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "high", assignedTo: "—" },
    { subject: "EIN validation page", clientName: "FIN Search", fromName: "Anila", status: "closed", priority: "low", assignedTo: "—" },
    { subject: "Pre Login General Contact Form not working", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "urgent", assignedTo: "—" },
    { subject: "Uneven CTA Arrows", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "low", assignedTo: "MisterSK Infotech" },
    { subject: "Blog CTA", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "normal", assignedTo: "MisterSK Infotech" },
    { subject: "LibertyData Page edit", clientName: "EIN Search", fromName: "Anila", status: "closed", priority: "urgent", assignedTo: "—" }
];

async function main() {
  const clients = await prisma.client.findMany();
  if (clients.length === 0) {
    console.log("No clients in db, skipping seed.");
    return;
  }

  // Create clients if they don't exist
  let ein = await prisma.client.findFirst({ where: { name: "EIN Search" } });
  if (!ein) ein = await prisma.client.create({ data: { name: "EIN Search", companyName: "EIN Search Ltd" } });
  
  let fin = await prisma.client.findFirst({ where: { name: "FIN Search" } });
  if (!fin) fin = await prisma.client.create({ data: { name: "FIN Search", companyName: "FIN Search Ltd" } });
  
  let datum = await prisma.client.findFirst({ where: { name: "Datum" } });
  if (!datum) datum = await prisma.client.create({ data: { name: "Datum", companyName: "Datum LLC" } });

  const getClientId = (name: string) => {
    if (name === "EIN Search") return ein!.id;
    if (name === "FIN Search") return fin!.id;
    if (name === "Datum") return datum!.id;
    return clients[0].id;
  };

  const allTickets = [...activeTickets, ...closedTickets];
  for (const t of allTickets) {
    await prisma.ticket.create({
      data: {
        subject: t.subject,
        clientId: getClientId(t.clientName),
        fromName: t.fromName,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assignedTo
      }
    });
  }

  console.log("Seeded " + allTickets.length + " tickets.");
}

main()
  .then(async () => {
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
