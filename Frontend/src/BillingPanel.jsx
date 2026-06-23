import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RiBillLine, RiFileList2Line, RiMoneyDollarCircleLine, RiArrowRightSLine, RiArrowLeftLine } from 'react-icons/ri';

const API_BASE = 'http://localhost:8000/api';

function BillingAdmin() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = sessionStorage.getItem('bae_admin_token');
  const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {}; 

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await axios.get(`${API_BASE}/bills`, authHeaders);
        setBills(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error(err);
        setError('Unable to load bills from server');
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const totalRevenue = bills.reduce((sum, bill) => sum + (Number(bill.total) || 0), 0);
  const totalInvoices = bills.length;
  const sortedBills = bills.slice().sort((a, b) => new Date(b.bill_date || b.createdAt) - new Date(a.bill_date || a.createdAt));
  const latestBill = sortedBills[0];

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#0f0e0d', padding: '2rem' }}>
      <button onClick={() => navigate('/admin')} style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', background: 'linear-gradient(135deg, #d4a373, #b88655)', color: '#0f0e0d', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(212,163,115,0.25)', transition: 'all 0.2s ease', zIndex: '50' }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
        <RiArrowLeftLine className='w-4 h-4' /> Back to Admin
      </button>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className='mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl space-y-3'>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d4a373', fontWeight: '600' }}>Billing Hub</p>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f4f1de' }}>Invoice management</h1>
            <p style={{ fontSize: '0.88rem', color: '#a5a198' }}>Use the existing billing flow to create invoices and the invoice registry to review, print, or edit bills.</p>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Link to='/Create_bill' style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '9999px', background: 'linear-gradient(135deg, #d4a373, #b88655)', padding: '0.7rem 1.25rem', color: '#0f0e0d', fontSize: '0.88rem', fontWeight: '700', textDecoration: 'none', boxShadow: '0 4px 12px rgba(212,163,115,0.25)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,163,115,0.35)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(212,163,115,0.25)'; }}>
              <RiBillLine className='h-4 w-4' /> Create Invoice
            </Link>
            <Link to='/Show_all' style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '9999px', backgroundColor: '#171513', padding: '0.7rem 1.25rem', color: '#d4a373', fontSize: '0.88rem', fontWeight: '700', textDecoration: 'none', border: '1px solid #2c2825', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d4a373'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2c2825'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <RiFileList2Line className='h-4 w-4' /> View All Invoices
            </Link>
          </div>
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
          <section style={{ borderRadius: '12px', border: '1px solid #2c2825', backgroundColor: '#171513', padding: '2rem' }}>
            <div className='grid gap-6 md:grid-cols-3 mb-10'>
              <div style={{ borderRadius: '12px', border: '1px solid #2c2825', backgroundColor: '#0f0e0d', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5a198', fontWeight: '600' }}>Total invoices</p>
                <p style={{ marginTop: '1rem', fontSize: '1.75rem', fontWeight: '700', color: '#d4a373' }}>{totalInvoices}</p>
                <p style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: '#a5a198' }}>All generated bills in the system.</p>
              </div>

              <div style={{ borderRadius: '12px', border: '1px solid #2c2825', backgroundColor: '#0f0e0d', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5a198', fontWeight: '600' }}>Total revenue</p>
                <p style={{ marginTop: '1rem', fontSize: '1.75rem', fontWeight: '700', color: '#2a9d8f' }}>₹{totalRevenue.toFixed(2)}</p>
                <p style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: '#a5a198' }}>Revenue from invoices.</p>
              </div>

              <div style={{ borderRadius: '12px', border: '1px solid #2c2825', backgroundColor: '#0f0e0d', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5a198', fontWeight: '600' }}>Latest invoice</p>
                {latestBill ? (
                  <>
                    <p style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: '700', color: '#f4f1de' }}>{latestBill.bill_no || 'N/A'}</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.88rem', color: '#a5a198' }}>{latestBill.party_name || 'Unknown customer'}</p>
                  </>
                ) : (
                  <p style={{ marginTop: '1rem', fontSize: '0.88rem', color: '#a5a198' }}>No invoices yet.</p>
                )}
              </div>
            </div>

            <div className='mb-6 flex items-center justify-between'>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#f4f1de', marginBottom: '0.25rem' }}>Recent invoices</h2>
                <p style={{ fontSize: '0.88rem', color: '#a5a198' }}>Quick access to the latest bills from the same billing workflow.</p>
              </div>
              <Link to='/Show_all' style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.88rem', fontWeight: '700', color: '#d4a373', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = '#f4a46b'} onMouseLeave={(e) => e.currentTarget.style.color = '#d4a373'}>
                View all <RiArrowRightSLine className='h-4 w-4' />
              </Link>
            </div>

            {loading ? (
              <div style={{ borderRadius: '12px', border: '1px dashed #2c2825', padding: '2rem', textAlign: 'center', color: '#a5a198' }}>Loading invoices…</div>
            ) : error ? (
              <div style={{ borderRadius: '12px', border: '1px solid #2c2825', backgroundColor: 'rgba(230,57,70,0.05)', padding: '2rem', textAlign: 'center', color: '#e63946' }}>{error}</div>
            ) : bills.length === 0 ? (
              <div style={{ borderRadius: '12px', border: '1px dashed #2c2825', padding: '2rem', textAlign: 'center', color: '#a5a198' }}>No invoices created yet.</div>
            ) : (
              <div className='space-y-4'>
                {sortedBills.slice(0, 5).map((bill) => (
                  <div key={bill._id} style={{ borderRadius: '12px', border: '1px solid #2c2825', padding: '1.25rem', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d4a373'; e.currentTarget.style.backgroundColor = 'rgba(212,163,115,0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2c2825'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                      <div>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5a198', fontWeight: '600' }}>Invoice #</p>
                        <p style={{ marginTop: '0.5rem', fontSize: '1rem', fontWeight: '700', color: '#f4f1de' }}>{bill.bill_no || '–'}</p>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#a5a198' }}>
                        {new Date(bill.bill_date || bill.createdAt).toLocaleDateString()} · ₹{(Number(bill.total) || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className='mt-4 grid gap-3 sm:grid-cols-3'>
                      <div style={{ borderRadius: '12px', backgroundColor: '#0f0e0d', padding: '0.75rem' }}>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5a198', fontWeight: '600' }}>Party</p>
                        <p style={{ marginTop: '0.25rem', fontSize: '0.88rem', fontWeight: '600', color: '#f4f1de' }}>{bill.party_name || 'Unknown'}</p>
                      </div>
                      <div className='rounded-2xl bg-slate-50 p-3'>
                        <p className='text-xs uppercase tracking-[0.24em] text-slate-400'>Items</p>
                        <p className='mt-1 text-sm font-medium text-slate-800'>{bill.Billing_data?.length || 0}</p>
                      </div>
                      <div className='rounded-2xl bg-slate-50 p-3'>
                        <p className='text-xs uppercase tracking-[0.24em] text-slate-400'>Status</p>
                        <p className='mt-1 text-sm font-medium text-emerald-700'>Ready</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className='rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-100'>
            <h2 className='text-xl font-bold text-slate-900 mb-4'>Billing toolkit</h2>
            <div className='space-y-4'>
              <Link to='/Create_bill' className='block rounded-3xl border border-indigo-100 bg-indigo-50 p-5 hover:bg-indigo-100 transition'>
                <p className='text-sm font-semibold text-indigo-700'>Create a new bill</p>
                <p className='mt-2 text-sm text-slate-500'>Launch the invoice creation form.</p>
              </Link>
              <Link to='/Show_all' className='block rounded-3xl border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100 transition'>
                <p className='text-sm font-semibold text-slate-900'>Open invoice registry</p>
                <p className='mt-2 text-sm text-slate-500'>Review and print past invoices.</p>
              </Link>
              <div className='rounded-3xl border border-slate-200 bg-slate-50 p-5'>
                <p className='text-sm font-semibold text-slate-900'>Latest invoice</p>
                {latestBill ? (
                  <p className='mt-2 text-sm text-slate-600'>{latestBill.bill_no || 'N/A'} · ₹{(Number(latestBill.total) || 0).toFixed(2)}</p>
                ) : (
                  <p className='mt-2 text-sm text-slate-600'>No invoice available yet.</p>
                )}
              </div>
              <div className='rounded-3xl border border-slate-200 bg-slate-50 p-5'>
                <p className='text-sm font-semibold text-slate-900'>Revenue goal</p>
                <p className='mt-2 text-sm text-slate-600'>₹{(totalRevenue * 0.75).toFixed(2)} estimated from current invoices.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default BillingAdmin;
