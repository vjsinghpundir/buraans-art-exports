import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LuFileText, LuCalendar, LuUser, LuPhone, LuDownload, LuArrowLeft } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
// import Sign from '/Sign.png'
// import Msme from '/MSME_No.png'

const API_BASE = 'http://localhost:8000/api';

function Show_all() {
    const navigate = useNavigate();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pdfBill, setPdfBill] = useState(null);
    const token = sessionStorage.getItem('bae_admin_token');
    const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

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

    const downloadPDF = (bill) => {
        setPdfBill(bill);
        setTimeout(() => {
            const element = document.getElementById('tally-invoice-print');
            if (!element) return;
            const opt = {
                margin: [2, 2, 2, 2],
                filename: `Invoice_${bill.bill_no || 'Draft'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 3, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save().then(() => setPdfBill(null));
        }, 500);
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            const response = await axios.get(`${API_BASE}/bills`, authHeaders);
            setBills(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching bills:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#0f0e0d', padding: '3rem 1rem' }}>
            <button onClick={() => navigate('/admin')} style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', background: 'linear-gradient(135deg, #d4a373, #b88655)', color: '#0f0e0d', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(212,163,115,0.25)', transition: 'all 0.2s ease', zIndex: '50' }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                <LuArrowLeft className='w-4 h-4' /> Back to Admin
            </button>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f4f1de', marginBottom: '0.2rem' }}>All Invoices</h1>
                        <p style={{ fontSize: '0.78rem', color: '#a5a198', marginTop: '0.2rem' }}>Manage and view all generated bills</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : bills.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center shadow-xl shadow-indigo-100/50 border border-white">
                        <LuFileText className="mx-auto h-16 w-16 text-indigo-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No bills found</h3>
                        <p className="text-gray-500">You haven't generated any invoices yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bills.map((bill) => (
                            <div key={bill._id} className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-indigo-100/40 border border-white hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                                                #{bill.bill_no || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-gray-500 text-xs font-medium gap-1.5 mt-2">
                                            <LuCalendar className="w-3.5 h-3.5" />
                                            {bill.bill_date || new Date(bill.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total</div>
                                        <div className="flex items-center justify-end font-black text-xl text-indigo-700">
                                                <span className="w-5 h-5 mr-0.5 opacity-80 inline-flex items-center justify-center">₹</span>
                                            {bill.total ? bill.total.toFixed(2) : '0.00'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mt-0.5">
                                            <LuUser className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{bill.party_name || 'Unknown Party'}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{bill.party_address || 'No address'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                            <LuPhone className="w-4 h-4" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">{bill.party_phone || 'No phone'}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <div className="text-xs text-gray-400 font-medium">
                                        {bill.Billing_data?.length || 0} items
                                    </div>
                                    <div className="flex gap-2">
                                        <Link to={`/Edit_bill/${bill._id}`} className="text-amber-600 font-semibold text-sm bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
                                            Edit
                                        </Link>
                                        <button onClick={() => downloadPDF(bill)} className="text-indigo-600 font-semibold text-sm bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 group-hover:text-indigo-700">
                                            <LuDownload className="w-4 h-4" />
                                            PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Hidden Tally Invoice Print Source */}
            {pdfBill && (
                <div style={{ position: 'absolute', top: '-30000px', left: 0 }}>
                    <style>{`
                        #tally-invoice-print, #tally-invoice-print * {
                            border-color: #9ca3af !important;
                        }
                        div#tally-invoice-print {
                            background-color: #ffffff !important;
                            color: #000000 !important;
                        }
                        #tally-invoice-print .bg-gray-50\\/10 { background-color: #f9fafb !important; }
                        #tally-invoice-print .text-gray-600 { color: #4b5563 !important; }
                        #tally-invoice-print .text-white { color: #ffffff !important; }
                        #tally-invoice-print td, #tally-invoice-print th, #tally-invoice-print div {
                            background-color: transparent;
                            color: inherit;
                        }
                    `}</style>
                    <div id="tally-invoice-print" className="bg-white text-black text-[11px] p-4 w-[210mm] min-h-[290mm] font-sans">
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
                                            <div className='font-bold'>{pdfBill.bill_no}</div>
                                        </div>
                                        <div className='flex justify-between flex-col'>
                                            <div>Invoice Date</div>
                                            <div className="font-bold">{pdfBill.bill_date ? pdfBill.bill_date.split('T')[0].split('-').reverse().join('-') : ''}</div>
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
                                <div className="font-bold text-[13px]">{pdfBill.party_name || '-'}</div>
                                <div>{pdfBill.party_address || '-'}</div>
                                <div className="flex justify-between">
                                    <span>
                                        GSTIN/UIN: {pdfBill.party_gstin || pdfBill.party_gst || '-'}
                                    </span>
                                    <span> Ph # :{pdfBill.party_phone || pdfBill.party_mobile || '-'}</span></div>
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
                                <tr className="bg-gray-50/10 border-none border-collapse">
                                    <th className="border border-gray-400 pb-3 w-10 text-[10px] font-bold">Sl No.</th>
                                    <th className="border border-gray-400 pb-3 text-[10px] font-bold">Description of Goods</th>
                                    <th className="border border-gray-400 pb-3 w-17.5 text-[10px] font-bold">HSN/SAC</th>
                                    <th className="border border-gray-400 pb-3 w-12 text-[10px] font-bold">Qty</th>
                                    <th className="border border-gray-400 pb-3 w-16 text-[10px] font-bold">Rate</th>
                                    <th className="border border-gray-400 pb-3 w-24 text-[10px] font-bold">Amount</th>
                                </tr>
                            </thead>
                            <tbody className='border-collapse'>
                                {(pdfBill.Billing_data || []).map((row, i) => (
                                    <tr key={i} className="h-6">
                                        <td className=" p-1 text-[11px] align-top">{i + 1}</td>
                                        <td className=" p-1 text-left font-bold text-[11px] align-top">{row.Description}</td>
                                        <td className=" p-1 text-[11px] align-top">{row.HSCODE}</td>
                                        <td className=" p-1 text-[11px] align-top">{row.QTY}</td>
                                        <td className=" p-1 text-[11px] align-top">{row.PRICE}</td>
                                        <td className=" p-1 font-bold text-right text-[11px] align-top">{row.Total ? row.Total.toFixed(2) : ''}</td>
                                    </tr>
                                ))}
                                {/* Blank padding rows */}
                                {Array.from({ length: Math.max(0, 22 - (pdfBill.Billing_data || []).length) }).map((_, i) => (
                                    <tr key={'blank' + i} className="h-6">
                                        <td className=" p-1 text-[8px] text-white">.</td>
                                        <td className=" p-1"></td>
                                        <td className=" p-1"></td>
                                        <td className=" p-1"></td>
                                        <td className=" p-1"></td>
                                        <td className=" p-1"></td>
                                    </tr>
                                ))}


                                <tr className="border border-black text-[11px]">
                                    <td className=" p-1" colSpan={4}>
                                        <div className='flex justify-between pb-2'>
                                            <div>SGST :- <span className='font-bold'>{pdfBill.SGST > 0 ? pdfBill.SGST.toFixed(2) : '0.00'}</span></div>
                                            <div>CGST :- <span className='font-bold'>{pdfBill.CGST > 0 ? pdfBill.CGST.toFixed(2) : '0.00'}</span></div>
                                            <div>IGST :- <span className='font-bold'>{pdfBill.IGST > 0 ? pdfBill.IGST.toFixed(2) : '0.00'}</span></div>
                                            <div>Round off :- <span className='font-bold'>{pdfBill.total ? (Math.round(pdfBill.total) - pdfBill.total).toFixed(2) : '0.00'}</span></div>
                                        </div>
                                    </td>


                                    <td className="border border-black p-1 text-right font-bold text-[15px]" colSpan={2}>
                                        <div className='pb-2'>
                                            Total :- ₹ {pdfBill.total ? Math.round(pdfBill.total).toFixed(2) : '0.00'}
                                        </div>
                                    </td>

                                </tr>
                            </tbody>
                        </table>

                        <div className="border border-t-0 border-black p-2 -mt-px">
                            <div className="text-[10px] text-gray-600 mb-1">Amount Chargeable (in words)</div>
                            <div className="font-bold italic text-[11px]">INR {pdfBill.total ? convertToWords(Math.floor(pdfBill.total)) : 'ZERO ONLY'}</div>
                        </div>

                        <div className="flex border border-black -mt-px">
                            <div className="w-1/2 p-2 border-r border-black relative">
                                <div className="underline font-bold mb-1 text-[10px]">Declaration</div>
                                <div className="text-[10px]">
                                    We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                                </div>
                                <div className="text-[10px] absolute bottom-2 left-2 italic font-bold">SUBJECT TO JODHPUR JURISDICTION ONLY</div>
                            </div>
                                <div className="w-1/2 p-2 relative min-h-22.5 flex justify-between items-center">
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
            )
            }
        </div >
    );
}

export default Show_all;
