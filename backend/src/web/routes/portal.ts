import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";

export const portalRouter = Router();

// Customer portal: CUSTOMER and ADMIN roles can access
portalRouter.use(authenticate, authorize(["CUSTOMER", "ADMIN"]));

portalRouter.get("/my/invoices", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.clientId) return res.json({ data: [], linked: false });
  const invoices = await prisma.invoice.findMany({ 
    where: { clientId: user.clientId }, 
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
    }
  });
  res.json({ data: invoices, linked: true, clientId: user.clientId });
});

portalRouter.get("/my/invoices/:id/dte", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.clientId) return res.status(400).json({ message: "User not linked to client" });
  const inv = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!inv || inv.clientId !== user.clientId) return res.status(404).json({ message: "Not found" });
  const dte = await prisma.dTE.findUnique({ where: { invoiceId: inv.id } });
  res.json({ data: dte ?? { status: "PENDING" } });
});

// Get admin's current client link status
portalRouter.get("/my/client-link", async (req, res) => {
  const user = await prisma.user.findUnique({ 
    where: { id: req.user!.id },
    include: { client: true }
  });
  
  if (!user) return res.status(404).json({ message: "User not found" });
  
  res.json({ 
    linked: !!user.clientId,
    clientId: user.clientId,
    client: user.client ? {
      id: user.client.id,
      name: user.client.name,
      taxId: user.client.taxId,
      email: user.client.email,
    } : null
  });
});

// Link admin account to client
portalRouter.post("/link-client/:clientId", authorize(["ADMIN"]), async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.user!.id;
    
    // Verificar que el cliente existe
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ message: "Client not found" });
    
    // Verificar que el cliente no esté ya vinculado a otro usuario
    const existingLink = await prisma.user.findFirst({
      where: { 
        clientId,
        id: { not: userId }
      }
    });
    
    if (existingLink) {
      return res.status(400).json({ 
        message: "Este cliente ya está vinculado a otro usuario" 
      });
    }
    
    // Vincular usuario con cliente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { clientId },
      include: { client: true }
    });
    
    res.json({ 
      message: "Cuenta vinculada exitosamente",
      data: {
        linked: true,
        client: {
          id: updatedUser.client!.id,
          name: updatedUser.client!.name,
          taxId: updatedUser.client!.taxId,
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al vincular cuenta", error: error.message });
  }
});

// Unlink admin account from client
portalRouter.post("/unlink-client", authorize(["ADMIN"]), async (req, res) => {
  try {
    const userId = req.user!.id;
    
    await prisma.user.update({
      where: { id: userId },
      data: { clientId: null }
    });
    
    res.json({ 
      message: "Cuenta desvinculada exitosamente",
      data: { linked: false }
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al desvincular cuenta", error: error.message });
  }
});

// Get all clients for linking (admin only)
portalRouter.get("/available-clients", authorize(["ADMIN"]), async (req, res) => {
  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      taxId: true,
      email: true,
      users: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  });
  
  res.json({ data: clients });
});


