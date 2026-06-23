const Bill = require('../models/billModel');

const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({}).sort({ createdAt: -1 });
    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bills', error: error.message });
  }
};

const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bill', error: error.message });
  }
};

const createBill = async (req, res) => {
  try {
    const {
      bill_no,
      bill_date,
      party_name,
      party_address,
      party_gst,
      party_phone,
      party_email,
      subtotal,
      SGST,
      CGST,
      IGST,
      total,
      Billing_data,
    } = req.body;

    if (!bill_no || !bill_date || !party_name || !total) {
      return res.status(400).json({ message: 'bill_no, bill_date, party_name, and total are required' });
    }

    const existing = await Bill.findOne({ bill_no: bill_no.trim() });
    if (existing) {
      return res.status(400).json({ message: `Invoice ${bill_no} already exists` });
    }

    const bill = await Bill.create({
      bill_no: bill_no.trim(),
      bill_date,
      party_name,
      party_address,
      party_gst,
      party_phone,
      party_email,
      subtotal: Number(subtotal) || 0,
      SGST: Number(SGST) || 0,
      CGST: Number(CGST) || 0,
      IGST: Number(IGST) || 0,
      total: Number(total) || 0,
      Billing_data: Array.isArray(Billing_data) ? Billing_data : [],
    });

    res.status(201).json(bill);
  } catch (error) {
    res.status(400).json({ message: 'Error creating bill', error: error.message });
  }
};

const updateBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const updatedFields = {
      bill_no: req.body.bill_no || bill.bill_no,
      bill_date: req.body.bill_date || bill.bill_date,
      party_name: req.body.party_name || bill.party_name,
      party_address: req.body.party_address || bill.party_address,
      party_gst: req.body.party_gst || bill.party_gst,
      party_phone: req.body.party_phone || bill.party_phone,
      party_email: req.body.party_email || bill.party_email,
      subtotal: Number(req.body.subtotal) || bill.subtotal,
      SGST: Number(req.body.SGST) || bill.SGST,
      CGST: Number(req.body.CGST) || bill.CGST,
      IGST: Number(req.body.IGST) || bill.IGST,
      total: Number(req.body.total) || bill.total,
      Billing_data: Array.isArray(req.body.Billing_data) ? req.body.Billing_data : bill.Billing_data,
    };

    const updatedBill = await Bill.findByIdAndUpdate(req.params.id, updatedFields, { new: true, runValidators: true });
    res.status(200).json(updatedBill);
  } catch (error) {
    res.status(400).json({ message: 'Error updating bill', error: error.message });
  }
};

const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    await bill.deleteOne();
    res.status(200).json({ message: 'Bill deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting bill', error: error.message });
  }
};

module.exports = { getBills, getBillById, createBill, updateBill, deleteBill };
