import React, { useRef, useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LuArrowLeft } from "react-icons/lu";
import axios from 'axios'
import html2pdf from 'html2pdf.js';
// import Sign from '/Sign.png'
// import Msme from '/MSME_No.png'

const API_BASE = 'http://localhost:8000/api';

function Create_bill() {
    const navigate = useNavigate();
    const [gst, setgst] = useState(18);
    const [rows, setRows] = useState(Array.from({ length: 20 }, () => ({ description: '', hscode: '', qty: '1', price: '', gst: '18', igst: '' })))
    const [bills, setBills] = useState([]);
    const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([]);
    const token = sessionStorage.getItem('bae_admin_token');
    const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    const [partyData, setPartyData] = useState({
        party_name: '',
        party_address: '',
        party_gstin: '',
        party_mobile: '',
        party_email: ''
    });

    const handlePartyChange = (e) => {
        const { name, value } = e.target;

        if (name === 'party_name') {
            // Find if this exact party name exists in our previous bills
            const existingBill = bills.find(b => b.party_name === value);

            if (existingBill) {
                // Auto-fill everything based on the found bill
                setPartyData({
                    party_name: value,
                    party_address: existingBill.party_address || '',
                    party_gstin: existingBill.party_gst || '',
                    party_mobile: existingBill.party_phone || '',
                    party_email: existingBill.party_email || ''
                });
                return;
            }
        }

        // Otherwise just update normally
        setPartyData(prev => ({ ...prev, [name]: value }));
    };



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

    const Setgst = (e) => {
        setgst(e.target.value)
    }

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    }

    const convertToWords = (num) => {
        if (!num) return "ZERO";
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        if ((num = num.toString()).length > 9) return 'overflow';
        let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return ''; let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
        return str.trim();
    }
    const totalInWords = convertToWords(Math.floor(total));

    const generatePDF = (data) => {
        const element = document.getElementById('tally-invoice');
        if (!element) return;

        const opt = {
            margin: [2, 2, 2, 2],
            filename: `Invoice_${data.bill_no || 'Draft'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    }

    const Submit = (e) => {
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
            bill_no: e.target.bill_no.value,
            bill_date: e.target.bill_date.value,
            party_name: e.target.party_name.value,
            party_address: e.target.party_address.value,
            party_gst: e.target.party_gstin.value,
            party_phone: e.target.party_mobile.value,
            party_email: e.target.party_email.value,
            subtotal: subtotal,
            gst: 0,
            SGST: SGST,
            CGST: CGST,
            IGST: totalIGST,
            total: total,
            Billing_data: billingData
        }
        axios.post(`${API_BASE}/bills`, data, authHeaders)
            .then((res) => {
                console.log(res.data);
                generatePDF(data);
                setTimeout(() => navigate('/Show_all'), 1500);
            })
            .catch((err) => {
                console.log(err);
            })

    }


    const fetchBills = async () => {
        try {
            const response = await axios.get(`${API_BASE}/bills`, authHeaders);
            setBills(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching bills:", error);
        }
    };
    const getitems = async () => {
        try {
            const response = await axios.get(`${API_BASE}/items`);
            setItems(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };


    const inputClasses = "w-full focus:outline-none border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 bg-gray-50/50 rounded-xl px-4 py-2.5 text-gray-700 transition-all duration-300";
    const tableInputClasses = "w-full bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 px-3 py-1.5 rounded-lg transition-all border border-transparent focus:border-indigo-200";

    useEffect(() => {
        fetchBills();
        getitems();
    }, []);


    return (
        <div className='min-h-screen w-full' style={{ backgroundColor: '#0f0e0d' }}>
            <button onClick={() => navigate('/admin')} style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', background: 'linear-gradient(135deg, #d4a373, #b88655)', color: '#0f0e0d', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(212,163,115,0.25)', transition: 'all 0.2s ease', zIndex: '50' }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                <LuArrowLeft className='w-4 h-4' /> Back to Admin
            </button>
            <form action="" onSubmit={Submit} className="w-full" style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem', minHeight: '100vh' }}>
                <div style={{ width: '100%', maxWidth: '1100px', backgroundColor: '#171513', border: '1px solid #2c2825', borderRadius: '12px', padding: '2rem' }}>

                    {/* Header Details */}
                    <div className='flex flex-col md:flex-row justify-between gap-6 mb-10'>
                        <div className="flex-1 space-y-2">
                            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600">Invoice</h2>
                            <p className="text-sm text-gray-500 font-medium">Create and manage a new bill</p>
                        </div>
                        <div className="flex gap-4 md:gap-6 items-center">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Invoice No</label>
                                <input type="text" value={"L - " + (bills.length + 1)} name='bill_no' readOnly className={`${inputClasses} font-mono font-bold text-center w-30 bg-gray-100/80 cursor-not-allowed text-indigo-900 border-none ring-0`} />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                                <input type="Date" name='bill_date' value={billDate} onChange={(e) => setBillDate(e.target.value)} className={`w-full focus:outline-none border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 bg-gray-50/50 rounded-xl px-4 py-2.5 text-gray-700 transition-all duration-300`} />
                            </div>
                        </div>
                    </div>

                    {/* Party Details */}
                    <div className="bg-indigo-50/40 rounded-3xl p-6 md:p-8 border border-indigo-50/80 mb-10 space-y-5">
                        <div className='flex flex-col md:flex-row gap-5'>
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest ml-1">Party Name</label>
                                <input type="text" name="party_name" list="party_names" value={partyData.party_name} onChange={handlePartyChange} placeholder='Enter Party Name' className={`${inputClasses} font-bold text-lg text-indigo-950 placeholder:font-normal`} />
                                <datalist id="party_names">
                                    {[...new Set(bills.map(b => b.party_name).filter(Boolean))].map((name, i) => (
                                        <option key={i} value={name} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="flex-2 space-y-1.5">
                                <label className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest ml-1">Party Address</label>
                                <input type="text" name="party_address" list="party_addresses" value={partyData.party_address} onChange={handlePartyChange} placeholder='Enter full address' className={inputClasses} />
                                <datalist id="party_addresses">
                                    {[...new Set(bills.map(b => b.party_address).filter(Boolean))].map((addr, i) => (
                                        <option key={i} value={addr} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                        <div className='flex flex-col md:flex-row gap-5'>
                            <div className='flex-1 space-y-1.5'>
                                <label className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest ml-1">Party GSTIN no.</label>
                                <input type="text" name="party_gstin" list="party_gsts" value={partyData.party_gstin} onChange={handlePartyChange} placeholder='Enter GSTIN no.' className={`${inputClasses} font-mono uppercase tracking-wider`} />
                                <datalist id="party_gsts">
                                    {[...new Set(bills.map(b => b.party_gst).filter(Boolean))].map((gst, i) => (
                                        <option key={i} value={gst} />
                                    ))}
                                </datalist>
                            </div>
                            <div className='flex-1 space-y-1.5'>
                                <label className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest ml-1">Mobile no.</label>
                                <input type="text" name="party_mobile" list="party_phones" value={partyData.party_mobile} onChange={handlePartyChange} placeholder='Enter Mobile no.' className={`${inputClasses} font-mono tracking-wider [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} />
                                <datalist id="party_phones">
                                    {[...new Set(bills.map(b => b.party_phone).filter(Boolean))].map((phone, i) => (
                                        <option key={i} value={phone} />
                                    ))}
                                </datalist>
                            </div>
                            <div className='flex-1 space-y-1.5'>
                                <label className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest ml-1">Mail ID</label>
                                <input type="text" name="party_email" list="party_emails" value={partyData.party_email} onChange={handlePartyChange} placeholder='Enter E-Mail id' className={`${inputClasses} font-mono tracking-wider [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} />
                                <datalist id="party_emails">
                                    {[...new Set(bills.map(b => b.party_email).filter(Boolean))].map((email, i) => (
                                        <option key={i} value={email} />
                                    ))}
                                </datalist>
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
                                                <input type="text" name={"description_" + i} list="item_list" className={tableInputClasses} placeholder={i === 0 ? "Item description" : ""} onChange={(e) => handleRowChange(i, 'description', e.target.value)} />
                                                <datalist id="item_list">
                                                    {items.map((item, index) => (
                                                        <option key={index} value={item.Item} />
                                                    ))}
                                                </datalist>
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="text" name={`hs_code_${i}`} className={tableInputClasses} value={row.hscode} onChange={(e) => handleRowChange(i, 'hscode', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="number" name={`qty_${i}`} className={`${tableInputClasses} text-center`} value={row.qty} onChange={(e) => handleRowChange(i, 'qty', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="number" name={`price_${i}`} className={tableInputClasses} value={row.price} onChange={(e) => handleRowChange(i, 'price', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="number" name={`gst_${i}`} className={`${tableInputClasses} text-center`} value={row.gst} onChange={(e) => handleRowChange(i, 'gst', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="number" name={`igst_${i}`} className={`${tableInputClasses} text-center`} value={row.igst} onChange={(e) => handleRowChange(i, 'igst', e.target.value)} />
                                            </td>
                                            <td className="p-2 border-l border-gray-50">
                                                <input type="number" name={`total_${i}`} value={rowTotal || ''} readOnly className={`${tableInputClasses} font-semibold text-right text-indigo-900 bg-transparent focus:bg-transparent focus:ring-0 focus:border-transparent`} />
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
                                    <div className="flex items-center gap-1.5 text-indigo-700">
                                        <span className="w-5 h-5 inline-flex items-center justify-center">₹</span>
                                        <input type="text" className='w-28 text-right bg-transparent outline-none text-2xl font-black tracking-tight' value={total.toFixed(2)} readOnly />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className='w-full bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200/80 hover:shadow-indigo-300/80 transform transition-all active:scale-[0.98] mt-10 text-lg tracking-widest uppercase hover:from-indigo-700 hover:to-violet-700 flex justify-center items-center gap-2 border border-indigo-400/50'>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Bill
                    </button>
                </div>
            </form>
            <Outlet />

            {/* Hidden Tally Invoice Print Source */}
            <div style={{ position: 'absolute', top: '-30000px', left: 0 }}>
                <style>{`
                    #tally-invoice, #tally-invoice * {
                        border-color: #9ca3af !important;
                    }
                    div#tally-invoice {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                    }
                    #tally-invoice .bg-gray-50\\/10 { background-color: #f9fafb !important; }
                    #tally-invoice .text-gray-600 { color: #4b5563 !important; }
                    #tally-invoice .text-white { color: #ffffff !important; }
                    #tally-invoice td, #tally-invoice th, #tally-invoice div {
                        background-color: transparent;
                        color: inherit;
                    }
                `}</style>
                <div id="tally-invoice" className="bg-white text-black text-[11px] p-4 w-[210mm] min-h-[290mm] font-sans">
                    <div className="text-center font-bold text-lg mb-1 tracking-wider py-1">TAX INVOICE</div>
                    <div >
                        <div className='flex border border-b-0'>
                            <div className='flex flex-col flex-1 p-2'>
                                <div className="font-bold text-[14px] ">BURAANS ART EXPORTS</div>
                                <div >Plot No. 12, khasra No. 297/2,</div>
                                <div > Salawas Station Road, Jodhpur Raj.</div>
                                <div > PAN : 08AGTPC2395P</div>
                                <div >GSTIN/UIN: 08AGTPC2395P1ZL</div>
                                <div >State Name: Rajasthan, Code: 08</div>
                            </div>
                            <div className='flex border-l  flex-col flex-1 p-2'>
                                <div className='flex justify-between pb-2'>
                                    <div className='flex justify-between flex-col'>
                                        <div>Invoice No.</div>
                                        <div className='font-bold'>{bills.length + 1}</div>
                                    </div>
                                    <div className='flex justify-between flex-col'>
                                        <div>Invoice Date</div>
                                        <div className="font-bold">{billDate ? billDate.split('-').reverse().join('-') : ''}</div>
                                    </div>
                                </div>
                                <div className='flex justify-between border-t '>
                                    <div className='flex flex-col border-r pr-2 flex-1 mr-2'>
                                        <div >BANK DETAILS : <br /> STATE BANK OF INDIA</div>
                                        <div>A/c : 38947708517</div>
                                        <div> IFSC CODE : SBIN0031375</div>
                                    </div>
                                    <div className='flex flex-col '>
                                        <div>Original for Receipient</div>
                                        <div>Duplicate for Supplier/transporter</div>
                                        <div>triplicate for supplier</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='flex border-r border-l'>
                        <div className='flex flex-col flex-1 pb-4 border-r p-2'>
                            <div className="text-gray-600 text-[10px]">Buyer (Bill to)</div>
                            <div className="font-bold text-[13px]">{partyData.party_name || '-'}</div>
                            <div>{partyData.party_address || '-'}</div>
                            <div className="flex justify-between">
                                <span>
                                    GSTIN/UIN: {partyData.party_gstin || '-'}
                                </span>
                                <span> Ph # :{partyData.party_mobile || '-'}</span></div>
                        </div>
                        <div className='flex flex-col flex-1 p-2'>
                            <div>TRANSPORTATION MODE : TRUCK / TAXI</div>
                            <div>VEHICLE NUMBER :</div>
                            <div>BILL MODE :</div>
                            <div>PLACE OF SUPPLY :</div>
                        </div>
                    </div>

                    <table className="w-full text-center -mt-px border-collapse border border-gray-400">
                        <thead>
                            <tr className="bg-gray-50/10">
                                <th className="border border-gray-400 pb-3 w-10 text-[10px] font-bold">Sl No.</th>
                                <th className="border border-gray-400 pb-3 text-[10px] font-bold">Description of Goods</th>
                                <th className="border border-gray-400 pb-3 w-17.5 text-[10px] font-bold">HSN/SAC</th>
                                <th className="border border-gray-400 pb-3 w-12 text-[10px] font-bold">Qty</th>
                                <th className="border border-gray-400 pb-3 w-16 text-[10px] font-bold">Rate</th>
                                <th className="border border-gray-400 pb-3 w-24 text-[10px] font-bold">Amount</th>
                            </tr>
                        </thead>
                        <tbody className='border-collapse'>
                            {rows.filter(r => r.description || r.price).map((row, i) => {
                                const base = (Number(row.price) || 0) * (Number(row.qty) || 0);
                                return (
                                    <tr key={i} className="h-6">
                                        <td className=" p-1 text-[11px] align-top">{i + 1}</td>
                                        <td className=" p-1 text-left font-bold text-[11px] align-top">{row.description}</td>
                                        <td className=" p-1 text-[11px] align-top">{row.hscode}</td>
                                        <td className=" p-1 text-[11px] align-top">{row.qty}</td>
                                        <td className=" p-1 text-[11px] align-top">{row.price}</td>
                                        <td className=" p-1 font-bold text-right text-[11px] align-top">{base > 0 ? base.toFixed(2) : ''}</td>
                                    </tr>
                                );
                            })}
                            {/* Blank padding rows */}
                            {Array.from({ length: Math.max(0, 22 - rows.filter(r => r.description).length) }).map((_, i) => (
                                <tr key={'blank' + i} className="h-6">
                                    <td className=" p-1 text-[8px] text-white">.</td>
                                    <td className=" p-1"></td>
                                    <td className=" p-1"></td>
                                    <td className=" p-1"></td>
                                    <td className=" p-1"></td>
                                    <td className=" p-1"></td>
                                </tr>
                            ))}


                            {/* Totals Row */}
                            <tr className="border border-black text-[11px]">
                                <td className=" p-1" colSpan={4}>
                                    <div className='flex justify-between pb-2'>
                                        <div>SGST :- <span className='font-bold'>{SGST > 0 ? SGST.toFixed(2) : '0.00'}</span></div>
                                        <div>CGST :- <span className='font-bold'>{CGST > 0 ? CGST.toFixed(2) : '0.00'}</span></div>
                                        <div>IGST :- <span className='font-bold'>{totalIGST > 0 ? totalIGST.toFixed(2) : '0.00'}</span></div>
                                        <div>Round off :- <span className='font-bold'>{(Math.round(total) - total).toFixed(2)}</span></div>
                                    </div>
                                </td>
                                <td className="border border-black p-1 text-right font-bold text-[15px]" colSpan={2}>
                                    <div className='pb-2'>
                                            Total :- ₹ {Math.round(total).toFixed(2)}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="border border-t-0 border-black p-2 -mt-px">
                        <div className="text-[10px] text-gray-600 mb-1">Amount Chargeable (in words)</div>
                        <div className="font-bold italic text-[11px]">INR {totalInWords}</div>
                    </div>

                    <div className="flex border border-black -mt-px">
                        <div className="w-1/2 p-2 border-r border-black relative">
                            <div className="underline font-bold mb-1 text-[10px]">Declaration</div>
                            <div className="text-[10px]">
                                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                            </div>
                            <div className="text-[10px] absolute bottom-2 left-2 italic font-bold">SUBJECT TO JODHPUR JURISDICTION ONLY</div>
                        </div>
                        <div className='w-1/2 p-2 relative min-h-22.5 flex justify-between items-center'>
                            <div className='flex justify-center'>
                                <img src={'/MSME_No.png'} className='h-15' alt="MSME" />
                            </div>
                            <div className='flex flex-col items-center'>
                                <div className="text-right font-bold text-[11px]">for BURAANS ART EXPORTS</div>
                                <div className='flex justify-center'>
                                    <img src={'/Sign.png'} className='h-12' alt="Signature" />
                                </div>
                                <div className="bottom-2 right-2 text-[11px] font-bold">Authorised Signatory</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Create_bill;
