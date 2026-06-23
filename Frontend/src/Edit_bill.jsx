import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { LuArrowLeft } from "react-icons/lu";
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function Edit_bill() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = sessionStorage.getItem('bae_admin_token');
    const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    const [loading, setLoading] = useState(true);
    const [gst, setgst] = useState(18);
    const [rows, setRows] = useState(Array.from({ length: 20 }, () => ({ description: '', hscode: '', qty: '1', price: '', gst: '18', igst: '' })));

    // Additional state for existing standard fields
    const [formData, setFormData] = useState({
        bill_no: '',
        bill_date: '',
        party_name: '',
        party_address: '',
        party_gst: '',
        party_phone: '',
        party_email: ''
    });

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const response = await axios.get(`${API_BASE}/bills/${id}`, authHeaders);
                const data = response.data;
                if (data) {
                    setFormData({
                        bill_no: data.bill_no || '',
                        bill_date: data.bill_date ? new Date(data.bill_date).toISOString().split('T')[0] : (data.bill_date || ''),
                        party_name: data.party_name || '',
                        party_address: data.party_address || '',
                        party_gst: data.party_gst || '',
                        party_phone: data.party_phone || '',
                        party_email: data.party_email || ''
                    });
                    setgst(data.gst || 18);

                    if (data.Billing_data && data.Billing_data.length > 0) {
                        const newRows = Array.from({ length: 20 }, (_, i) => {
                            if (i < data.Billing_data.length) {
                                const item = data.Billing_data[i];
                                return {
                                    description: item.Description || '',
                                    hscode: item.HSCODE || '',
                                    qty: item.QTY || '1',
                                    price: item.PRICE || '',
                                    gst: item.GST !== undefined ? String(item.GST) : '18',
                                    igst: item.IGST !== undefined ? String(item.IGST) : ''
                                };
                            }
                            return { description: '', hscode: '', qty: '1', price: '', gst: '18', igst: '' };
                        });
                        setRows(newRows);
                    }
                }
            } catch (error) {
                console.error("Error fetching bill details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBill();
    }, [id]);

    // Calculate totals per product
    const subtotal = rows.reduce((acc, row) => acc + ((Number(row.qty) || 0) * (Number(row.price) || 0)), 0);
    const SGST = rows.reduce((acc, row) => {
        const rowBase = (Number(row.qty) || 0) * (Number(row.price) || 0);
        const rowGst = Number(row.gst) || 0;
        return acc + (rowBase * rowGst) / 200;
    }, 0);
    const CGST = SGST; // CGST = SGST (half of GST each)
    const totalIGST = rows.reduce((acc, row) => {
        const rowBase = (Number(row.qty) || 0) * (Number(row.price) || 0);
        const rowIgst = Number(row.igst) || 0;
        return acc + (rowBase * rowIgst) / 100;
    }, 0);
    const total = subtotal + SGST + CGST + totalIGST;

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const Submit = async (e) => {
        e.preventDefault();

        const validRows = rows.filter(row => row.description || row.price);
        const billingData = validRows.map((row) => {
            const base = (Number(row.price) || 0) * (Number(row.qty) || 0);
            const rowGst = Number(row.gst) || 0;
            const rowIgst = Number(row.igst) || 0;
            const rowSGST = (base * rowGst) / 200;
            const rowCGST = rowSGST;
            const rowIGST = (base * rowIgst) / 100;
            return {
                Description: row.description,
                HSCODE: row.hscode,
                QTY: Number(row.qty) || 1,
                PRICE: Number(row.price) || 0,
                GST: rowGst,
                IGST: rowIgst,
                Total: Number((base).toFixed(2))
            };
        });

        const data = {
            ...formData,
            subtotal,
            gst: 0,
            SGST,
            CGST,
            IGST: totalIGST,
            total,
            Billing_data: billingData
        };

        try {
            const res = await axios.put(`${API_BASE}/bills/${id}`, data, authHeaders);
            console.log(res.data);
            navigate('/Show_all');
        } catch (err) {
            console.error(err);
        }
    };

    const inputClasses = "w-full focus:outline-none border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 bg-gray-50/50 rounded-xl px-4 py-2.5 text-gray-700 transition-all duration-300";
    const tableInputClasses = "w-full bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 px-3 py-1.5 rounded-lg transition-all border border-transparent focus:border-indigo-200";

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className='min-h-screen w-full' style={{ backgroundColor: '#0f0e0d' }}>
            <button onClick={() => navigate('/admin')} style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', background: 'linear-gradient(135deg, #d4a373, #b88655)', color: '#0f0e0d', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(212,163,115,0.25)', transition: 'all 0.2s ease', zIndex: '50' }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                <LuArrowLeft className='w-4 h-4' /> Back to Admin
            </button>
            <form onSubmit={Submit} className="w-full" style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem', minHeight: '100vh' }}>
                <div style={{ width: '100%', maxWidth: '1100px', backgroundColor: '#171513', border: '1px solid #2c2825', borderRadius: '12px', padding: '2rem' }}>

                    <div className='flex flex-col md:flex-row justify-between gap-6 mb-10'>
                        <div className="flex-1 space-y-2">
                            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-500">Edit Invoice</h2>
                            <p className="text-sm text-gray-500 font-medium">Update your generated bill</p>
                        </div>
                        <div className="flex gap-4 md:gap-6 items-center">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Invoice No</label>
                                <input type="text" name='bill_no' value={formData.bill_no} onChange={handleFormChange} readOnly className={`${inputClasses} font-mono font-bold text-center w-30 bg-gray-100/80 cursor-not-allowed`} />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                                <input type="Date" name='bill_date' value={formData.bill_date} onChange={handleFormChange} className={inputClasses} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50/40 rounded-3xl p-6 md:p-8 border border-indigo-50/80 mb-10 space-y-5">
                        <div className='flex flex-col md:flex-row gap-5'>
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest ml-1">Party Name</label>
                                <input type="text" name="party_name" value={formData.party_name} onChange={handleFormChange} placeholder='Enter Party Name' className={`${inputClasses} font-bold text-lg text-indigo-950`} />
                            </div>
                            <div className="flex-2 space-y-1.5">
                                <label className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest ml-1">Party Address</label>
                                <input type="text" name="party_address" value={formData.party_address} onChange={handleFormChange} placeholder='Enter full address' className={inputClasses} />
                            </div>
                        </div>
                        <div className='flex flex-col md:flex-row gap-5'>
                            <div className='flex-1 space-y-1.5'>
                                <label className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest ml-1">Party GSTIN no.</label>
                                <input type="text" name="party_gst" value={formData.party_gst} onChange={handleFormChange} placeholder='Enter GSTIN no.' className={`${inputClasses} font-mono uppercase tracking-wider`} />
                            </div>
                            <div className='flex-1 space-y-1.5'>
                                <label className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest ml-1">Mobile no.</label>
                                <input type="text" name="party_phone" value={formData.party_phone} onChange={handleFormChange} placeholder='Enter Mobile no.' className={`${inputClasses} font-mono tracking-wider [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} />
                            </div>
                            <div className='flex-1 space-y-1.5'>
                                <label className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest ml-1">Mail ID</label>
                                <input type="text" name="party_email" value={formData.party_email} onChange={handleFormChange} placeholder='Enter E-Mail id' className={`${inputClasses} font-mono tracking-wider`} />
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm mb-10">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-5 py-4 w-auto">Description</th>
                                    <th className="px-5 py-4 w-28 border-l border-gray-100">HSN/SAC</th>
                                    <th className="px-5 py-4 w-20 border-l border-gray-100 text-center">Qty</th>
                                    <th className="px-5 py-4 w-28 border-l border-gray-100">Price</th>
                                    <th className="px-5 py-4 w-20 border-l border-gray-100 text-center">GST %</th>
                                    <th className="px-5 py-4 w-20 border-l border-gray-100 text-center">IGST %</th>
                                    <th className="px-5 py-4 w-32 border-l border-gray-100 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {rows.map((row, i) => {
                                    const rowBase = (Number(row.qty) || 0) * (Number(row.price) || 0);
                                    const rowGstAmt = (rowBase * (Number(row.gst) || 0)) / 100;
                                    const rowIgstAmt = (rowBase * (Number(row.igst) || 0)) / 100;
                                    const rowTotal = rowBase;
                                    return (
                                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="p-2">
                                                <input type="text" className={tableInputClasses} placeholder={i === 0 ? "Item description" : ""} value={row.description} onChange={(e) => handleRowChange(i, 'description', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="text" className={tableInputClasses} value={row.hscode} onChange={(e) => handleRowChange(i, 'hscode', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="number" className={`${tableInputClasses} text-center`} value={row.qty} onChange={(e) => handleRowChange(i, 'qty', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="number" className={tableInputClasses} value={row.price} onChange={(e) => handleRowChange(i, 'price', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="number" className={`${tableInputClasses} text-center`} value={row.gst} onChange={(e) => handleRowChange(i, 'gst', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="number" className={`${tableInputClasses} text-center`} value={row.igst} onChange={(e) => handleRowChange(i, 'igst', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="number" value={rowTotal || ''} readOnly className={`${tableInputClasses} font-semibold text-right text-indigo-900 bg-transparent focus:bg-transparent focus:ring-0 focus:border-transparent`} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className='flex justify-end'>
                        <div className="w-full max-w-sm space-y-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className='flex justify-between items-center text-gray-600 font-semibold'>
                                <span className="text-sm uppercase tracking-wider">Subtotal</span>
                                <div className="flex items-center gap-1.5 text-gray-800">
                                    <span className="w-4 h-4 text-gray-400 inline-flex items-center justify-center">₹</span>
                                    <input type="text" className='w-24 text-right bg-transparent outline-none font-bold text-lg' value={subtotal.toFixed(2)} readOnly />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className='flex justify-between items-center text-gray-500 text-sm'>
                                    <span className="font-medium">SGST</span>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3.5 h-3.5 opacity-60 inline-flex items-center justify-center">₹</span>
                                        <input type="text" className='w-24 text-right bg-transparent outline-none font-medium' value={SGST.toFixed(2)} readOnly />
                                    </div>
                                </div>
                                <div className='flex justify-between items-center text-gray-500 text-sm'>
                                    <span className="font-medium">CGST</span>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3.5 h-3.5 opacity-60 inline-flex items-center justify-center">₹</span>
                                        <input type="text" className='w-24 text-right bg-transparent outline-none font-medium' value={CGST.toFixed(2)} readOnly />
                                    </div>
                                </div>
                                <div className='flex justify-between items-center text-gray-500 text-sm pt-1'>
                                    <span className="font-medium">IGST</span>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3.5 h-3.5 opacity-60 inline-flex items-center justify-center">₹</span>
                                        <input type="text" className='w-24 text-right bg-transparent outline-none font-medium' value={totalIGST.toFixed(2)} readOnly />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5 border-t border-gray-200/80 mt-2">
                                <div className='flex justify-between items-center'>
                                    <span className="text-sm font-bold text-gray-800 uppercase tracking-widest">Grand Total</span>
                                    <div className="flex items-center gap-1.5 text-amber-600">
                                        <span className="w-5 h-5 inline-flex items-center justify-center">₹</span>
                                        <input type="text" className='w-28 text-right bg-transparent outline-none text-2xl font-black tracking-tight' value={total.toFixed(2)} readOnly />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className='w-full bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-amber-200/80 hover:shadow-orange-300/80 transform transition-all active:scale-[0.98] mt-10 text-lg tracking-widest uppercase flex justify-center items-center gap-2 border border-amber-400/50'>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Update Bill
                    </button>
                </div>
            </form>
            <Outlet />
        </div>
    );
}

export default Edit_bill;
