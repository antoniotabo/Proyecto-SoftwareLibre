const express = require('express');
const router = express.Router();
const fletesCtrl = require('../controllers/fletes');
const packingCtrl = require('../controllers/packing');
const facturasCtrl = require('../controllers/facturas');
const comprasCtrl = require('../controllers/compras');
const usuariosCtrl = require('../controllers/usuario');
const transportistasCtrl = require('../controllers/transportistas');
const proveedoresCtrl = require('../controllers/proveedores');
const clientesCtrl = require('../controllers/clientes');
const auth = require('../middlewares/auth');

/* Usuarios */
router.post('/register', usuariosCtrl.register);
router.post('/login', usuariosCtrl.login);
router.get('/usuarios', auth, usuariosCtrl.getUsuarios);

/* Fletes */
router.get('/fletes', fletesCtrl.getFletes);
router.post('/fletes', auth, fletesCtrl.createFlete);
router.put('/fletes/:id', auth, fletesCtrl.updateFlete);
router.delete('/fletes/:id', auth, fletesCtrl.deleteFlete);

/* Packing */
router.get('/packing', packingCtrl.getPacking);
router.get('/packing/:id/items', packingCtrl.getPackingItems);
router.post('/packing', auth, packingCtrl.createPacking);
router.put('/packing/:id', auth, packingCtrl.updatePacking);
router.put('/packing/items/:itemId', auth, packingCtrl.updatePackingItem);
router.delete('/packing/items/:itemId', auth, packingCtrl.deletePackingItem);
router.delete('/packing/:id', auth, packingCtrl.deletePacking);

/* Facturas */
router.get('/facturas', facturasCtrl.getFacturas);
router.get('/facturas/:id/items', facturasCtrl.getFacturaItems);
router.post('/facturas', auth, facturasCtrl.createFactura);
router.put('/facturas/:id', auth, facturasCtrl.updateFactura);
router.put('/facturas/items/:itemId', auth, facturasCtrl.updateFacturaItem);
router.delete('/facturas/items/:itemId', auth, facturasCtrl.deleteFacturaItem);
router.delete('/facturas/:id', auth, facturasCtrl.deleteFactura);
router.post('/cobranzas', auth, facturasCtrl.registrarCobranza);

/* Compras */
router.get('/compras', comprasCtrl.getCompras);
router.get('/compras/:id/gastos', comprasCtrl.getCompraGastos);
router.post('/compras', auth, comprasCtrl.createCompra);
router.put('/compras/:id', auth, comprasCtrl.updateCompra);
router.delete('/compras/:id', auth, comprasCtrl.deleteCompra);
router.post('/compras/gastos', auth, comprasCtrl.registrarGasto);

/* Transportistas */
router.get('/transportistas', transportistasCtrl.getTransportistas);
router.get('/transportistas/:id', transportistasCtrl.getTransportistaById);
router.post('/transportistas', auth, transportistasCtrl.createTransportista);
router.put('/transportistas/:id', auth, transportistasCtrl.updateTransportista);
router.delete('/transportistas/:id', auth, transportistasCtrl.deleteTransportista);

/* Proveedores */
router.get('/proveedores', proveedoresCtrl.getProveedores);
router.get('/proveedores/:id', proveedoresCtrl.getProveedorById);
router.post('/proveedores', auth, proveedoresCtrl.createProveedor);
router.put('/proveedores/:id', auth, proveedoresCtrl.updateProveedor);
router.delete('/proveedores/:id', auth, proveedoresCtrl.deleteProveedor);

/* Clientes */
router.get('/clientes', clientesCtrl.getClientes);
router.get('/clientes/:id', clientesCtrl.getClienteById);
router.post('/clientes', auth, clientesCtrl.createCliente);
router.put('/clientes/:id', auth, clientesCtrl.updateCliente);
router.delete('/clientes/:id', auth, clientesCtrl.deleteCliente);

module.exports = router;