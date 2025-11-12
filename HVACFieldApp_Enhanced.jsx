import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Minus, Calculator, FileText, Wrench, Book, Save, Printer,
  Trash2, X, Check, Clock, DollarSign, Camera, Download,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, Info, Zap,
  Settings, Moon, Sun, ArrowLeft, Edit2, Copy, Filter
} from 'lucide-react';

const HVACFieldApp = () => {
  // ========== STATE MANAGEMENT ==========
  const [activeTab, setActiveTab] = useState('service');
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimer = useRef(null);

  const [serviceData, setServiceData] = useState({
    callType: 'maintenance-cooling',
    customerName: '',
    address: '',
    phone: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
    timeIn: '',
    timeOut: '',
    equipmentType: '',
    modelNumber: '',
    serialNumber: '',
    yearInstalled: '',
    findings: '',
    workPerformed: '',
    recommendations: '',
    technicianName: '',
    laborRate: '95',
    photos: []
  });

  const [materialList, setMaterialList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    customer: true,
    equipment: true,
    details: true
  });

  const [calculations, setCalculations] = useState({
    duct: {
      cfm: '',
      velocity: '900',
      length: '',
      elbows: '0',
      shape: 'round'
    },
    superheat: {
      lineTemp: '',
      satTemp: ''
    },
    subcooling: {
      lineTemp: '',
      satTemp: ''
    },
    temperatureSplit: {
      returnTemp: '',
      supplyTemp: ''
    }
  });

  // ========== TOAST NOTIFICATION SYSTEM ==========
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ========== AUTO-SAVE FUNCTIONALITY ==========
  useEffect(() => {
    if (autoSave) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveDataSilently();
      }, 2000);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [serviceData, materialList, autoSave]);

  // ========== DATA PERSISTENCE ==========
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedService = await window.storage.get('current-service');
      const savedMaterials = await window.storage.get('current-materials');

      if (savedService) {
        setServiceData(JSON.parse(savedService.value));
        setLastSaved(new Date());
      }
      if (savedMaterials) {
        setMaterialList(JSON.parse(savedMaterials.value));
      }
    } catch (error) {
      console.log('No saved data found');
    }
  };

  const saveDataSilently = async () => {
    try {
      setIsSaving(true);
      await window.storage.set('current-service', JSON.stringify(serviceData));
      await window.storage.set('current-materials', JSON.stringify(materialList));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const saveData = async () => {
    try {
      setIsSaving(true);
      await window.storage.set('current-service', JSON.stringify(serviceData));
      await window.storage.set('current-materials', JSON.stringify(materialList));
      setLastSaved(new Date());
      showToast('Data saved successfully!', 'success');
    } catch (error) {
      showToast('Error saving data', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const clearData = () => {
    const confirmed = window.confirm('Clear all current data? This cannot be undone.');
    if (confirmed) {
      setServiceData({
        callType: 'maintenance-cooling',
        customerName: '',
        address: '',
        phone: '',
        email: '',
        date: new Date().toISOString().split('T')[0],
        timeIn: '',
        timeOut: '',
        equipmentType: '',
        modelNumber: '',
        serialNumber: '',
        yearInstalled: '',
        findings: '',
        workPerformed: '',
        recommendations: '',
        technicianName: '',
        laborRate: '95',
        photos: []
      });
      setMaterialList([]);
      showToast('Data cleared', 'info');

      window.storage.delete('current-service').catch(() => {});
      window.storage.delete('current-materials').catch(() => {});
    }
  };

  // ========== MATERIAL CATALOG ==========
  const materialCatalog = {
    equipment: [
      { name: 'Condensing Unit 2 Ton 14 SEER', price: 1250, part: 'CU-2T-14', category: 'equipment' },
      { name: 'Condensing Unit 3 Ton 16 SEER', price: 1650, part: 'CU-3T-16', category: 'equipment' },
      { name: 'Condensing Unit 4 Ton 16 SEER', price: 2100, part: 'CU-4T-16', category: 'equipment' },
      { name: 'Air Handler 2 Ton Multi-Speed', price: 850, part: 'AH-2T-MS', category: 'equipment' },
      { name: 'Air Handler 3 Ton Variable Speed', price: 1200, part: 'AH-3T-VS', category: 'equipment' },
      { name: 'Gas Furnace 80k BTU 80% AFUE', price: 950, part: 'GF-80K-80', category: 'equipment' },
      { name: 'Gas Furnace 100k BTU 95% AFUE', price: 1450, part: 'GF-100K-95', category: 'equipment' },
      { name: 'Heat Pump 2 Ton 15 SEER', price: 1800, part: 'HP-2T-15', category: 'equipment' },
      { name: 'Heat Pump 3 Ton 16 SEER', price: 2400, part: 'HP-3T-16', category: 'equipment' },
      { name: 'Ductless Mini-Split 12k BTU', price: 1100, part: 'MS-12K', category: 'equipment' }
    ],
    electrical: [
      { name: 'Contactor 30A Single Pole', price: 18, part: 'CONT-30A-1P', category: 'electrical' },
      { name: 'Contactor 40A Double Pole', price: 24, part: 'CONT-40A-2P', category: 'electrical' },
      { name: 'Capacitor 45+5 MFD 440V', price: 22, part: 'CAP-45-5-440', category: 'electrical' },
      { name: 'Capacitor 50+5 MFD 440V', price: 22, part: 'CAP-50-5-440', category: 'electrical' },
      { name: 'Capacitor 70+5 MFD 440V', price: 26, part: 'CAP-70-5-440', category: 'electrical' },
      { name: 'Disconnect 60A Fusible', price: 35, part: 'DISC-60A-F', category: 'electrical' },
      { name: 'Thermostat Programmable 2H/2C', price: 85, part: 'TSTAT-PROG', category: 'electrical' },
      { name: 'Thermostat WiFi Smart', price: 175, part: 'TSTAT-WIFI', category: 'electrical' },
      { name: 'Transformer 40VA 24V', price: 28, part: 'TRANS-40VA', category: 'electrical' },
      { name: 'Wire 18/8 Thermostat (per ft)', price: 0.45, part: 'WIRE-18-8', category: 'electrical' },
      { name: 'Wire 14/2 w/Ground (per ft)', price: 0.65, part: 'WIRE-14-2', category: 'electrical' },
      { name: 'Conduit Seal-Tite 3/4" (per ft)', price: 1.20, part: 'COND-ST-75', category: 'electrical' }
    ],
    iaq: [
      { name: 'Media Filter 16x25x5 MERV 11', price: 45, part: 'FILT-16-25-5-M11', category: 'iaq' },
      { name: 'Media Filter 20x25x5 MERV 13', price: 55, part: 'FILT-20-25-5-M13', category: 'iaq' },
      { name: 'UV Light System Dual Lamp', price: 425, part: 'UV-DUAL', category: 'iaq' },
      { name: 'Humidifier Bypass 12 GPD', price: 285, part: 'HUM-BP-12', category: 'iaq' },
      { name: 'Humidifier Steam 12 GPD', price: 650, part: 'HUM-ST-12', category: 'iaq' },
      { name: 'ERV 150 CFM', price: 1200, part: 'ERV-150', category: 'iaq' },
      { name: 'HEPA Filter System', price: 850, part: 'HEPA-SYS', category: 'iaq' },
      { name: 'Duct Ionizer', price: 375, part: 'ION-DUCT', category: 'iaq' }
    ],
    ductwork: [
      { name: 'Flex Duct 6" x 25ft Insulated R6', price: 32, part: 'FLEX-6-R6', category: 'ductwork' },
      { name: 'Flex Duct 8" x 25ft Insulated R6', price: 42, part: 'FLEX-8-R6', category: 'ductwork' },
      { name: 'Flex Duct 10" x 25ft Insulated R6', price: 58, part: 'FLEX-10-R6', category: 'ductwork' },
      { name: 'Flex Duct 12" x 25ft Insulated R6', price: 72, part: 'FLEX-12-R6', category: 'ductwork' },
      { name: 'Sheet Metal 26ga (per sq ft)', price: 3.50, part: 'METAL-26GA', category: 'ductwork' },
      { name: 'Duct Board R6 4ft x 8ft Sheet', price: 42, part: 'BOARD-R6-4X8', category: 'ductwork' },
      { name: 'Register 4"x10" White', price: 8, part: 'REG-4X10-W', category: 'ductwork' },
      { name: 'Register 6"x10" White', price: 12, part: 'REG-6X10-W', category: 'ductwork' },
      { name: 'Return Grille 14"x20" White', price: 18, part: 'GRILL-14X20', category: 'ductwork' },
      { name: 'Return Grille 20"x20" White', price: 28, part: 'GRILL-20X20', category: 'ductwork' },
      { name: 'Damper Balancing 8" Manual', price: 22, part: 'DAMP-8-BAL', category: 'ductwork' },
      { name: 'Damper Motorized 8" 24V', price: 145, part: 'DAMP-8-MOT', category: 'ductwork' },
      { name: 'Trunk Adapter 16" Round to Rect', price: 35, part: 'ADAPT-16-RR', category: 'ductwork' },
      { name: 'Plenum Supply 20"x20"x36"', price: 95, part: 'PLEN-20-20-36', category: 'ductwork' }
    ],
    warranty: [
      { name: 'Compressor 2 Ton', price: 485, part: 'COMP-2T', category: 'warranty' },
      { name: 'Compressor 3 Ton', price: 625, part: 'COMP-3T', category: 'warranty' },
      { name: 'Compressor 4 Ton', price: 785, part: 'COMP-4T', category: 'warranty' },
      { name: 'Blower Motor 1/2 HP PSC', price: 175, part: 'MOTOR-BL-05-PSC', category: 'warranty' },
      { name: 'Blower Motor 3/4 HP ECM', price: 385, part: 'MOTOR-BL-75-ECM', category: 'warranty' },
      { name: 'Condenser Fan Motor 1/4 HP', price: 145, part: 'MOTOR-CF-25', category: 'warranty' },
      { name: 'Inducer Motor Assembly', price: 265, part: 'MOTOR-IND', category: 'warranty' },
      { name: 'Control Board - Furnace', price: 185, part: 'BOARD-FURN', category: 'warranty' },
      { name: 'Control Board - Air Handler', price: 195, part: 'BOARD-AH', category: 'warranty' },
      { name: 'TXV 2-3 Ton', price: 75, part: 'TXV-2-3T', category: 'warranty' },
      { name: 'Gas Valve 24V Two-Stage', price: 125, part: 'VALVE-GAS-2STG', category: 'warranty' },
      { name: 'Ignitor Hot Surface', price: 45, part: 'IGNIT-HS', category: 'warranty' }
    ]
  };

  const callTypes = [
    { id: 'maintenance-cooling', label: 'Maintenance - Cooling', icon: '❄️' },
    { id: 'maintenance-heating', label: 'Maintenance - Heating', icon: '🔥' },
    { id: 'trouble-cooling', label: 'Trouble Call - Cooling', icon: '⚠️' },
    { id: 'trouble-heating', label: 'Trouble Call - Heating', icon: '🔧' },
    { id: 'drain', label: 'Drain Service', icon: '💧' },
    { id: 'install', label: 'Installation', icon: '🏗️' },
    { id: 'estimate', label: 'Estimate/Quote', icon: '📋' }
  ];

  // ========== MATERIAL MANAGEMENT ==========
  const addMaterial = (item) => {
    const qty = prompt('Enter quantity:', '1');
    if (qty && parseInt(qty) > 0) {
      setMaterialList([...materialList, { ...item, quantity: parseInt(qty), id: Date.now() }]);
      showToast(`Added ${item.name}`, 'success');
    }
  };

  const removeMaterial = (id) => {
    setMaterialList(materialList.filter(item => item.id !== id));
    showToast('Material removed', 'info');
  };

  const updateQuantity = (id, delta) => {
    setMaterialList(materialList.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const updateMaterialPrice = (id, newPrice) => {
    setMaterialList(materialList.map(item =>
      item.id === id
        ? { ...item, price: parseFloat(newPrice) || 0 }
        : item
    ));
  };

  // ========== CALCULATIONS ==========
  const calculateLaborCost = () => {
    if (!serviceData.timeIn || !serviceData.timeOut || !serviceData.laborRate) return 0;

    const timeIn = new Date(`2000-01-01 ${serviceData.timeIn}`);
    const timeOut = new Date(`2000-01-01 ${serviceData.timeOut}`);
    const hours = (timeOut - timeIn) / (1000 * 60 * 60);

    if (hours < 0) return 0;
    return hours * parseFloat(serviceData.laborRate);
  };

  const calculateMaterialsTotal = () => {
    return materialList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateSubtotal = () => {
    return calculateLaborCost() + calculateMaterialsTotal();
  };

  const calculateTax = (rate = 0.08) => {
    return calculateMaterialsTotal() * rate;
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const filteredCatalog = useCallback(() => {
    const category = selectedCategory === 'all'
      ? Object.values(materialCatalog).flat()
      : materialCatalog[selectedCategory] || [];

    if (!searchTerm) return category;

    const term = searchTerm.toLowerCase();
    return category.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.part.toLowerCase().includes(term)
    );
  }, [searchTerm, selectedCategory]);

  // ========== DUCT CALCULATIONS ==========
  const calculateDuctSize = () => {
    const cfm = parseFloat(calculations.duct.cfm);
    const velocity = parseFloat(calculations.duct.velocity);

    if (!cfm || !velocity) return null;

    const area = cfm / velocity;

    if (calculations.duct.shape === 'round') {
      const diameter = Math.sqrt(area / 0.7854) * 12;
      return { diameter: diameter.toFixed(1) };
    } else {
      const width = Math.sqrt(area * 2) * 12;
      const height = width / 2;
      return { width: width.toFixed(1), height: height.toFixed(1) };
    }
  };

  const estimateStaticPressure = () => {
    const length = parseFloat(calculations.duct.length) || 0;
    const elbows = parseInt(calculations.duct.elbows) || 0;
    const cfm = parseFloat(calculations.duct.cfm) || 0;

    const frictionLoss = (length / 100) * 0.1;
    const elbowLoss = elbows * 0.05;
    const velocityPressure = Math.pow(cfm / 1000, 2) * 0.01;

    return (frictionLoss + elbowLoss + velocityPressure).toFixed(3);
  };

  // ========== HVAC CALCULATIONS ==========
  const calculateSuperheat = () => {
    const line = parseFloat(calculations.superheat.lineTemp);
    const sat = parseFloat(calculations.superheat.satTemp);
    if (!line || !sat) return null;
    return (line - sat).toFixed(1);
  };

  const calculateSubcooling = () => {
    const sat = parseFloat(calculations.subcooling.satTemp);
    const line = parseFloat(calculations.subcooling.lineTemp);
    if (!line || !sat) return null;
    return (sat - line).toFixed(1);
  };

  const calculateTempSplit = () => {
    const returnTemp = parseFloat(calculations.temperatureSplit.returnTemp);
    const supplyTemp = parseFloat(calculations.temperatureSplit.supplyTemp);
    if (!returnTemp || !supplyTemp) return null;
    return (returnTemp - supplyTemp).toFixed(1);
  };

  // ========== REPORT GENERATION ==========
  const generateReport = () => {
    const reportWindow = window.open('', '_blank');
    const laborCost = calculateLaborCost();
    const materialsTotal = calculateMaterialsTotal();
    const taxAmount = calculateTax();
    const grandTotal = calculateGrandTotal();
    const laborHours = serviceData.timeIn && serviceData.timeOut
      ? ((new Date(`2000-01-01 ${serviceData.timeOut}`) - new Date(`2000-01-01 ${serviceData.timeIn}`)) / (1000 * 60 * 60)).toFixed(2)
      : 0;

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Report - ${serviceData.customerName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #1f2937;
            line-height: 1.6;
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
          }
          .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
          }
          .header-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.2);
          }
          .call-type-badge {
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            padding: 8px 20px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 14px;
          }
          .section {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .section h2 {
            color: #1e40af;
            font-size: 20px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #3b82f6;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 15px 0;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 15px;
            color: #111827;
            font-weight: 500;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #d1d5db;
            font-size: 14px;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:hover {
            background: #f9fafb;
          }
          .text-right { text-align: right; }
          .totals-table {
            margin-left: auto;
            width: 400px;
            margin-top: 20px;
          }
          .totals-table td {
            padding: 10px 15px;
          }
          .totals-row {
            font-weight: 600;
            font-size: 16px;
          }
          .grand-total {
            background: #dbeafe;
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
          }
          .signature-section {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 2px solid #e5e7eb;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-bottom: 2px solid #374151;
            margin: 40px 0 10px;
          }
          .signature-label {
            font-weight: 600;
            color: #374151;
          }
          @media print {
            body { padding: 20px; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HVAC Service Report</h1>
          <div class="header-meta">
            <div>
              <div style="font-size: 14px; opacity: 0.9;">Report #${Date.now().toString().slice(-8)}</div>
              <div style="font-size: 14px; opacity: 0.9;">Generated: ${new Date().toLocaleString()}</div>
            </div>
            <div class="call-type-badge">
              ${callTypes.find(t => t.id === serviceData.callType)?.icon || ''}
              ${callTypes.find(t => t.id === serviceData.callType)?.label || 'Service Call'}
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Customer Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Customer Name</div>
              <div class="info-value">${serviceData.customerName || 'Not provided'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Service Date</div>
              <div class="info-value">${new Date(serviceData.date).toLocaleDateString()}</div>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">Address</div>
              <div class="info-value">${serviceData.address || 'Not provided'}</div>
            </div>
            ${serviceData.phone ? `
              <div class="info-item">
                <div class="info-label">Phone</div>
                <div class="info-value">${serviceData.phone}</div>
              </div>
            ` : ''}
            ${serviceData.email ? `
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${serviceData.email}</div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <h2>Equipment Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Equipment Type</div>
              <div class="info-value">${serviceData.equipmentType || 'Not provided'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Model Number</div>
              <div class="info-value">${serviceData.modelNumber || 'Not provided'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Serial Number</div>
              <div class="info-value">${serviceData.serialNumber || 'Not provided'}</div>
            </div>
            ${serviceData.yearInstalled ? `
              <div class="info-item">
                <div class="info-label">Year Installed</div>
                <div class="info-value">${serviceData.yearInstalled}</div>
              </div>
            ` : ''}
          </div>
        </div>

        ${serviceData.findings ? `
          <div class="section">
            <h2>Findings</h2>
            <div style="white-space: pre-wrap;">${serviceData.findings}</div>
          </div>
        ` : ''}

        ${serviceData.workPerformed ? `
          <div class="section">
            <h2>Work Performed</h2>
            <div style="white-space: pre-wrap;">${serviceData.workPerformed}</div>
          </div>
        ` : ''}

        ${serviceData.recommendations ? `
          <div class="section">
            <h2>Recommendations</h2>
            <div style="white-space: pre-wrap;">${serviceData.recommendations}</div>
          </div>
        ` : ''}

        <div class="section">
          <h2>Service Summary</h2>

          ${laborCost > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Hours</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Labor (${serviceData.timeIn} - ${serviceData.timeOut})</td>
                  <td class="text-right">${laborHours}</td>
                  <td class="text-right">$${parseFloat(serviceData.laborRate).toFixed(2)}/hr</td>
                  <td class="text-right">$${laborCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          ` : ''}

          ${materialList.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Description</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${materialList.map(item => `
                  <tr>
                    <td style="font-family: monospace; color: #6b7280;">${item.part}</td>
                    <td>${item.name}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">$${item.price.toFixed(2)}</td>
                    <td class="text-right">$${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <table class="totals-table">
            <tbody>
              ${laborCost > 0 ? `
                <tr>
                  <td>Labor</td>
                  <td class="text-right">$${laborCost.toFixed(2)}</td>
                </tr>
              ` : ''}
              ${materialsTotal > 0 ? `
                <tr>
                  <td>Materials</td>
                  <td class="text-right">$${materialsTotal.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="totals-row">
                <td>Subtotal</td>
                <td class="text-right">$${calculateSubtotal().toFixed(2)}</td>
              </tr>
              ${materialsTotal > 0 ? `
                <tr>
                  <td>Tax (8%)</td>
                  <td class="text-right">$${taxAmount.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="grand-total">
                <td>TOTAL</td>
                <td class="text-right">$${grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Technician Signature</div>
            <div style="margin-top: 5px; color: #6b7280;">${serviceData.technicianName || ''}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Customer Signature</div>
            <div style="margin-top: 5px; color: #6b7280;">Date</div>
          </div>
        </div>
      </body>
      </html>
    `;

    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    showToast('Report generated', 'success');
  };

  // ========== DIAGNOSTIC DATA ==========
  const diagnosticFAQ = [
    {
      category: 'No Cooling',
      icon: '❄️',
      steps: [
        'Verify thermostat is set to COOL and below room temp',
        'Check breakers/disconnects - outdoor and indoor',
        'Check contactor - should pull in when calling for cooling',
        'Measure voltage at contactor: L1-L2 (240V) and load side',
        'If voltage present but compressor not running: check capacitor',
        'Measure capacitor: should read within 6% of rated MFD',
        'Check compressor windings: C-R, C-S, R-S (should show continuity)',
        'Measure amp draw on compressor (compare to nameplate RLA)',
        'Check suction/discharge pressures and superheat/subcooling'
      ]
    },
    {
      category: 'No Heating (Gas)',
      icon: '🔥',
      steps: [
        'Verify thermostat set to HEAT and above room temp',
        'Check gas supply - valve open, meter flowing',
        'Verify 24V at thermostat R and W terminals',
        'Check inducer motor operation - should start first',
        'Verify pressure switches close (use ohmmeter)',
        'Check ignitor - should glow bright orange (about 120V)',
        'Verify gas valve opens (24V at valve)',
        'Check flame sensor signal (microamps DC)',
        'Measure temperature rise across heat exchanger',
        'Inspect heat exchanger for cracks/damage'
      ]
    },
    {
      category: 'Poor Airflow',
      icon: '💨',
      steps: [
        'Check filter - replace if dirty/restrictive',
        'Verify all supply registers open',
        'Check blower wheel - clean if dirty',
        'Measure static pressure: return, supply, ESP',
        'Normal ESP: 0.5" or less, High: 0.8"+',
        'Check for duct leaks/disconnections',
        'Verify blower motor operation and speeds',
        'Measure amp draw on blower motor',
        'Check blower capacitor if PSC motor',
        'Inspect evaporator coil for blockage'
      ]
    },
    {
      category: 'Short Cycling',
      icon: '⚡',
      steps: [
        'Check thermostat differential/anticipator settings',
        'Measure system pressures - look for restrictions',
        'Check refrigerant charge (superheat/subcooling)',
        'Verify proper airflow across coils',
        'Check high pressure switch operation',
        'Inspect condenser coil - clean if dirty',
        'Check TXV operation (hunting)',
        'Verify compressor is not oversized for load',
        'Check for electrical issues causing lockout'
      ]
    },
    {
      category: 'Frozen Evaporator',
      icon: '🧊',
      steps: [
        'Turn system OFF and switch fan to ON',
        'Check filter and airflow restrictions',
        'Measure blower CFM (should be 350-450 per ton)',
        'Check refrigerant charge when thawed',
        'Inspect TXV - may be stuck or restricted',
        'Check for refrigerant restrictions (filter drier)',
        'Verify proper return air temperature',
        'Check blower speed/motor operation',
        'Inspect for duct leakage reducing airflow'
      ]
    },
    {
      category: 'Water Leaks',
      icon: '💧',
      steps: [
        'Identify source: condensate drain or refrigerant leak',
        'Check drain pan for cracks/holes',
        'Verify drain line pitch (1/4" per foot minimum)',
        'Clear drain line with wet/dry vac or nitrogen',
        'Check drain trap - must maintain water seal',
        'Inspect drain pan float switch operation',
        'Check for secondary drain obstruction',
        'Verify condensate pump operation if present',
        'Look for ice on suction line (low airflow/charge)'
      ]
    }
  ];

  const standardReadings = {
    'Cooling Mode': {
      icon: '❄️',
      readings: [
        { label: 'Suction Pressure', value: '70-75 PSI', note: 'Varies by ambient temp' },
        { label: 'Discharge Pressure', value: '225-275 PSI', note: 'Typical range' },
        { label: 'Superheat (TXV)', value: '8-12°F', note: 'Fixed: 10-20°F' },
        { label: 'Subcooling', value: '10-15°F', note: 'TXV system' },
        { label: 'Suction Line Temp', value: '50-55°F', note: 'At outdoor unit' },
        { label: 'Temperature Split', value: '18-22°F', note: 'Return vs Supply' },
        { label: 'Airflow', value: '350-450 CFM/ton', note: 'Standard' },
        { label: 'Static Pressure', value: '<0.5" WC', note: '<0.8" acceptable' }
      ]
    },
    'Heating Mode (Heat Pump)': {
      icon: '🔥',
      readings: [
        { label: 'Suction Pressure', value: '50-70 PSI', note: 'Depends on outdoor temp' },
        { label: 'Discharge Pressure', value: '225-300 PSI', note: 'Typical' },
        { label: 'Superheat', value: '15-25°F', note: 'Heating mode' },
        { label: 'Temperature Rise', value: '35-50°F', note: 'Across coil' },
        { label: 'Defrost Cycle', value: '30-90 min', note: 'Interval' }
      ]
    },
    'Gas Furnace': {
      icon: '🔥',
      readings: [
        { label: 'Gas Pressure (NG)', value: '3.5" WC', note: 'Propane: 11" WC' },
        { label: 'Temperature Rise', value: '40-70°F', note: 'Check nameplate' },
        { label: 'Flame Sensor', value: '0.5-10 μA DC', note: 'Microamps' },
        { label: 'Ignitor Voltage', value: '80-120V AC', note: 'During ignition' },
        { label: 'Inducer Motor', value: '1.5-3.5A', note: 'Typical draw' }
      ]
    }
  };

  // ========== RENDER FUNCTIONS ==========
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const CollapsibleSection = ({ title, children, section, icon: Icon }) => (
    <div className={`rounded-xl overflow-hidden transition-all duration-300 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
    } border shadow-sm`}>
      <button
        onClick={() => toggleSection(section)}
        className={`w-full flex items-center justify-between p-4 hover:bg-opacity-50 transition-colors ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className="text-blue-600" />}
          <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {title}
          </h3>
        </div>
        {expandedSections[section] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {expandedSections[section] && (
        <div className="p-4 pt-0 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-blue-50'
    }`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slideInRight">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white`}>
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <AlertCircle size={20} />}
            {toast.type === 'info' && <Info size={20} />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">HVAC Field Service Pro</h1>
              <p className="text-blue-100 text-sm mt-1">Professional service documentation & diagnostics</p>
            </div>
            <div className="flex items-center gap-3">
              {lastSaved && (
                <div className="text-sm text-blue-100 flex items-center gap-2">
                  <Clock size={16} />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={`sticky top-0 z-40 shadow-md ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
      } border-b`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto no-scrollbar">
            {[
              { id: 'service', icon: Wrench, label: 'Service Call', color: 'blue' },
              { id: 'materials', icon: Plus, label: 'Materials', color: 'green' },
              { id: 'calculator', icon: Calculator, label: 'Calculators', color: 'purple' },
              { id: 'diagnostics', icon: Book, label: 'Diagnostics', color: 'orange' },
              { id: 'report', icon: FileText, label: 'Report', color: 'indigo' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all relative ${
                  activeTab === tab.id
                    ? `text-${tab.color}-600 border-b-3 border-${tab.color}-600 ${
                        darkMode ? 'bg-gray-700' : 'bg-blue-50'
                      }`
                    : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {activeTab === tab.id && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${tab.color}-400 to-${tab.color}-600`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={saveData}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} className={isSaving ? 'animate-spin' : ''} />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={generateReport}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Printer size={18} />
                Print Report
              </button>
              <button
                onClick={clearData}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
              >
                <Trash2 size={18} />
                Clear
              </button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Auto-save
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* SERVICE CALL TAB */}
        {activeTab === 'service' && (
          <div className="space-y-6 animate-fadeIn">
            <CollapsibleSection title="Customer Information" section="customer" icon={null}>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={serviceData.customerName}
                    onChange={(e) => setServiceData({...serviceData, customerName: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={serviceData.phone}
                    onChange={(e) => setServiceData({...serviceData, phone: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={serviceData.email}
                    onChange={(e) => setServiceData({...serviceData, email: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="customer@email.com"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Service Date *
                  </label>
                  <input
                    type="date"
                    value={serviceData.date}
                    onChange={(e) => setServiceData({...serviceData, date: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Service Address *
                  </label>
                  <input
                    type="text"
                    value={serviceData.address}
                    onChange={(e) => setServiceData({...serviceData, address: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="123 Main Street, City, State 12345"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Time In
                  </label>
                  <input
                    type="time"
                    value={serviceData.timeIn}
                    onChange={(e) => setServiceData({...serviceData, timeIn: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Time Out
                  </label>
                  <input
                    type="time"
                    value={serviceData.timeOut}
                    onChange={(e) => setServiceData({...serviceData, timeOut: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Call Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {callTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setServiceData({...serviceData, callType: type.id})}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all transform hover:scale-105 ${
                        serviceData.callType === type.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                          : darkMode
                            ? 'border-gray-600 bg-gray-700 hover:border-blue-400'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div>{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Equipment Information" section="equipment" icon={Wrench}>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Equipment Type
                  </label>
                  <input
                    type="text"
                    value={serviceData.equipmentType}
                    onChange={(e) => setServiceData({...serviceData, equipmentType: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="Split System AC, Gas Furnace, etc."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Model Number
                  </label>
                  <input
                    type="text"
                    value={serviceData.modelNumber}
                    onChange={(e) => setServiceData({...serviceData, modelNumber: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="Model #"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={serviceData.serialNumber}
                    onChange={(e) => setServiceData({...serviceData, serialNumber: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="Serial #"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Year Installed
                  </label>
                  <input
                    type="text"
                    value={serviceData.yearInstalled}
                    onChange={(e) => setServiceData({...serviceData, yearInstalled: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="2020"
                  />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Service Details" section="details" icon={FileText}>
              <div className="space-y-4 mt-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Findings
                  </label>
                  <textarea
                    value={serviceData.findings}
                    onChange={(e) => setServiceData({...serviceData, findings: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    rows="4"
                    placeholder="Document your inspection findings..."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Work Performed
                  </label>
                  <textarea
                    value={serviceData.workPerformed}
                    onChange={(e) => setServiceData({...serviceData, workPerformed: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    rows="4"
                    placeholder="Describe the work you performed..."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Recommendations
                  </label>
                  <textarea
                    value={serviceData.recommendations}
                    onChange={(e) => setServiceData({...serviceData, recommendations: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    rows="4"
                    placeholder="Recommendations for the customer..."
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Technician Name
                    </label>
                    <input
                      type="text"
                      value={serviceData.technicianName}
                      onChange={(e) => setServiceData({...serviceData, technicianName: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                      }`}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Hourly Labor Rate ($)
                    </label>
                    <input
                      type="number"
                      value={serviceData.laborRate}
                      onChange={(e) => setServiceData({...serviceData, laborRate: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                      }`}
                      placeholder="95.00"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="space-y-6 animate-fadeIn">
            <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Material Catalog
              </h2>

              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search materials by name or part number..."
                    className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                  }`}
                >
                  <option value="all">All Categories</option>
                  <option value="equipment">Equipment</option>
                  <option value="electrical">Electrical</option>
                  <option value="iaq">Indoor Air Quality</option>
                  <option value="ductwork">Ductwork</option>
                  <option value="warranty">Warranty Parts</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                {filteredCatalog().map((item, idx) => (
                  <div
                    key={idx}
                    className={`border-2 rounded-lg p-4 transition-all hover:shadow-lg hover:scale-105 ${
                      darkMode ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">{item.part}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-2xl font-bold text-blue-600">${item.price.toFixed(2)}</div>
                      <button
                        onClick={() => addMaterial(item)}
                        className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {materialList.length > 0 && (
              <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Selected Materials ({materialList.length})
                </h2>
                <div className="space-y-3">
                  {materialList.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">{item.part}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className={`p-2 rounded-lg transition-all ${
                            darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-16 text-center font-bold text-lg">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className={`p-2 rounded-lg transition-all ${
                            darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="w-32 text-right">
                        <div className="text-sm text-gray-500">@ ${item.price.toFixed(2)}</div>
                        <div className="text-lg font-bold text-blue-600">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeMaterial(item.id)}
                        className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  <div className={`pt-4 border-t-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <div className="space-y-2 max-w-md ml-auto">
                      {calculateLaborCost() > 0 && (
                        <div className="flex justify-between text-lg">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Labor:</span>
                          <span className="font-semibold">${calculateLaborCost().toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Materials:</span>
                        <span className="font-semibold">${calculateMaterialsTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Tax (8%):</span>
                        <span className="font-semibold">${calculateTax().toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between text-2xl font-bold pt-3 border-t-2 ${
                        darkMode ? 'border-gray-600 text-blue-400' : 'border-gray-300 text-blue-600'
                      }`}>
                        <span>Total:</span>
                        <span>${calculateGrandTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CALCULATOR TAB */}
        {activeTab === 'calculator' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Duct Sizing Calculator */}
            <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-2xl font-bold mb-4 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <Calculator className="text-blue-600" />
                Duct Sizing Calculator
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    CFM Required
                  </label>
                  <input
                    type="number"
                    value={calculations.duct.cfm}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      duct: {...calculations.duct, cfm: e.target.value}
                    })}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="400"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Velocity (FPM)
                  </label>
                  <input
                    type="number"
                    value={calculations.duct.velocity}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      duct: {...calculations.duct, velocity: e.target.value}
                    })}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                  <div className="text-xs text-gray-500 mt-1">Supply: 700-900, Return: 500-700</div>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Shape
                  </label>
                  <select
                    value={calculations.duct.shape}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      duct: {...calculations.duct, shape: e.target.value}
                    })}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="round">Round</option>
                    <option value="rectangular">Rectangular</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Duct Length (ft)
                  </label>
                  <input
                    type="number"
                    value={calculations.duct.length}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      duct: {...calculations.duct, length: e.target.value}
                    })}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Number of Elbows
                  </label>
                  <input
                    type="number"
                    value={calculations.duct.elbows}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      duct: {...calculations.duct, elbows: e.target.value}
                    })}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="2"
                  />
                </div>
              </div>

              {calculations.duct.cfm && calculations.duct.velocity && (() => {
                const size = calculateDuctSize();
                return (
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                      <Zap size={24} />
                      Calculated Results
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white bg-opacity-20 rounded-lg p-4">
                        <div className="text-sm opacity-90 mb-1">Duct Size</div>
                        <div className="text-3xl font-bold">
                          {calculations.duct.shape === 'round'
                            ? `${size.diameter}" Ø`
                            : `${size.width}" × ${size.height}"`
                          }
                        </div>
                      </div>
                      {calculations.duct.length && (
                        <div className="bg-white bg-opacity-20 rounded-lg p-4">
                          <div className="text-sm opacity-90 mb-1">Est. Pressure Loss</div>
                          <div className="text-3xl font-bold">{estimateStaticPressure()}" WC</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* HVAC Calculations */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Superheat */}
              <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Superheat
                </h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Suction Line Temp (°F)"
                    value={calculations.superheat.lineTemp}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      superheat: {...calculations.superheat, lineTemp: e.target.value}
                    })}
                    className={`w-full px-3 py-2 rounded-lg border-2 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Saturation Temp (°F)"
                    value={calculations.superheat.satTemp}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      superheat: {...calculations.superheat, satTemp: e.target.value}
                    })}
                    className={`w-full px-3 py-2 rounded-lg border-2 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                  {calculateSuperheat() && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
                      <div className="text-sm opacity-90">Result</div>
                      <div className="text-3xl font-bold">{calculateSuperheat()}°F</div>
                      <div className="text-xs mt-1 opacity-80">Target: 8-12°F (TXV)</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subcooling */}
              <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Subcooling
                </h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Liquid Line Temp (°F)"
                    value={calculations.subcooling.lineTemp}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      subcooling: {...calculations.subcooling, lineTemp: e.target.value}
                    })}
                    className={`w-full px-3 py-2 rounded-lg border-2 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Saturation Temp (°F)"
                    value={calculations.subcooling.satTemp}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      subcooling: {...calculations.subcooling, satTemp: e.target.value}
                    })}
                    className={`w-full px-3 py-2 rounded-lg border-2 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                  {calculateSubcooling() && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
                      <div className="text-sm opacity-90">Result</div>
                      <div className="text-3xl font-bold">{calculateSubcooling()}°F</div>
                      <div className="text-xs mt-1 opacity-80">Target: 10-15°F</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Temperature Split */}
              <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Temp Split
                </h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Return Air Temp (°F)"
                    value={calculations.temperatureSplit.returnTemp}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      temperatureSplit: {...calculations.temperatureSplit, returnTemp: e.target.value}
                    })}
                    className={`w-full px-3 py-2 rounded-lg border-2 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Supply Air Temp (°F)"
                    value={calculations.temperatureSplit.supplyTemp}
                    onChange={(e) => setCalculations({
                      ...calculations,
                      temperatureSplit: {...calculations.temperatureSplit, supplyTemp: e.target.value}
                    })}
                    className={`w-full px-3 py-2 rounded-lg border-2 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                  {calculateTempSplit() && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white">
                      <div className="text-sm opacity-90">Result</div>
                      <div className="text-3xl font-bold">{calculateTempSplit()}°F</div>
                      <div className="text-xs mt-1 opacity-80">Target: 18-22°F</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIAGNOSTICS TAB */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6 animate-fadeIn">
            <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Diagnostic Procedures
              </h2>
              {diagnosticFAQ.map((section, idx) => (
                <div key={idx} className="mb-8">
                  <h3 className={`text-xl font-bold mb-4 pb-2 border-b-2 ${
                    darkMode ? 'text-blue-400 border-blue-600' : 'text-blue-900 border-blue-200'
                  } flex items-center gap-2`}>
                    <span className="text-2xl">{section.icon}</span>
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.steps.map((step, stepIdx) => (
                      <div
                        key={stepIdx}
                        className={`p-3 rounded-lg transition-all hover:scale-[1.02] ${
                          darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {stepIdx + 1}
                          </div>
                          <div className="flex-1">{step}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Standard Readings & Specifications
              </h2>
              {Object.entries(standardReadings).map(([category, data], idx) => (
                <div key={idx} className="mb-8">
                  <h3 className={`text-xl font-bold mb-4 pb-2 border-b-2 ${
                    darkMode ? 'text-blue-400 border-blue-600' : 'text-blue-900 border-blue-200'
                  } flex items-center gap-2`}>
                    <span className="text-2xl">{data.icon}</span>
                    {category}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {data.readings.map((reading, readingIdx) => (
                      <div
                        key={readingIdx}
                        className={`p-4 rounded-lg ${
                          darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-gray-50 to-blue-50'
                        }`}
                      >
                        <div className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>
                          {reading.label}
                        </div>
                        <div className="text-2xl font-bold my-1">{reading.value}</div>
                        <div className="text-sm text-gray-500">{reading.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORT TAB */}
        {activeTab === 'report' && (
          <div className="space-y-6 animate-fadeIn">
            <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Report Preview
              </h2>

              <div className={`border-2 rounded-xl p-6 ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-gray-50 to-blue-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>
                      Service Report
                    </h3>
                    <div className="text-sm text-gray-500 mt-1">
                      Generated: {new Date().toLocaleString()}
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-md">
                    {callTypes.find(t => t.id === serviceData.callType)?.icon} {' '}
                    {callTypes.find(t => t.id === serviceData.callType)?.label}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className={`font-bold text-lg mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Customer Information
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><strong>Name:</strong> {serviceData.customerName || 'Not entered'}</div>
                      <div><strong>Date:</strong> {new Date(serviceData.date).toLocaleDateString()}</div>
                      {serviceData.phone && <div><strong>Phone:</strong> {serviceData.phone}</div>}
                      {serviceData.email && <div><strong>Email:</strong> {serviceData.email}</div>}
                      <div className="md:col-span-2"><strong>Address:</strong> {serviceData.address || 'Not entered'}</div>
                      {serviceData.timeIn && (
                        <>
                          <div><strong>Time In:</strong> {serviceData.timeIn}</div>
                          <div><strong>Time Out:</strong> {serviceData.timeOut || 'Not entered'}</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className={`font-bold text-lg mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Equipment Information
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><strong>Type:</strong> {serviceData.equipmentType || 'Not entered'}</div>
                      <div><strong>Model:</strong> {serviceData.modelNumber || 'Not entered'}</div>
                      <div><strong>Serial:</strong> {serviceData.serialNumber || 'Not entered'}</div>
                      {serviceData.yearInstalled && (
                        <div><strong>Year Installed:</strong> {serviceData.yearInstalled}</div>
                      )}
                    </div>
                  </div>

                  {serviceData.findings && (
                    <div>
                      <h4 className={`font-bold text-lg mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Findings
                      </h4>
                      <div className={`p-4 rounded-lg text-sm whitespace-pre-wrap ${
                        darkMode ? 'bg-gray-600' : 'bg-white'
                      }`}>
                        {serviceData.findings}
                      </div>
                    </div>
                  )}

                  {serviceData.workPerformed && (
                    <div>
                      <h4 className={`font-bold text-lg mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Work Performed
                      </h4>
                      <div className={`p-4 rounded-lg text-sm whitespace-pre-wrap ${
                        darkMode ? 'bg-gray-600' : 'bg-white'
                      }`}>
                        {serviceData.workPerformed}
                      </div>
                    </div>
                  )}

                  {serviceData.recommendations && (
                    <div>
                      <h4 className={`font-bold text-lg mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Recommendations
                      </h4>
                      <div className={`p-4 rounded-lg text-sm whitespace-pre-wrap ${
                        darkMode ? 'bg-gray-600' : 'bg-white'
                      }`}>
                        {serviceData.recommendations}
                      </div>
                    </div>
                  )}

                  {(materialList.length > 0 || calculateLaborCost() > 0) && (
                    <div>
                      <h4 className={`font-bold text-lg mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Service Summary
                      </h4>

                      {calculateLaborCost() > 0 && (
                        <div className={`p-4 rounded-lg mb-3 ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">Labor</div>
                              <div className="text-sm text-gray-500">
                                {serviceData.timeIn} - {serviceData.timeOut} @ ${serviceData.laborRate}/hr
                              </div>
                            </div>
                            <div className="text-xl font-bold text-blue-600">
                              ${calculateLaborCost().toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}

                      {materialList.length > 0 && (
                        <div className="space-y-2">
                          {materialList.map((item) => (
                            <div key={item.id} className={`flex justify-between p-3 rounded-lg text-sm ${
                              darkMode ? 'bg-gray-600' : 'bg-white'
                            }`}>
                              <div>
                                <div className="font-medium">{item.quantity}x {item.name}</div>
                                <div className="text-xs text-gray-500">{item.part}</div>
                              </div>
                              <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={`mt-4 p-4 rounded-lg ${
                        darkMode ? 'bg-gray-600' : 'bg-blue-50'
                      }`}>
                        <div className="space-y-2">
                          <div className="flex justify-between text-lg">
                            <span>Subtotal:</span>
                            <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                          </div>
                          {calculateMaterialsTotal() > 0 && (
                            <div className="flex justify-between">
                              <span>Tax (8%):</span>
                              <span className="font-semibold">${calculateTax().toFixed(2)}</span>
                            </div>
                          )}
                          <div className={`flex justify-between text-2xl font-bold pt-3 border-t-2 ${
                            darkMode ? 'border-gray-500 text-blue-400' : 'border-blue-200 text-blue-600'
                          }`}>
                            <span>TOTAL:</span>
                            <span>${calculateGrandTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={generateReport}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <Printer size={24} />
                  Open Printable Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HVACFieldApp;