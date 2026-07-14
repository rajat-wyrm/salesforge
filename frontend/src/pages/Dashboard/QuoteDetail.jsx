import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quoteService } from "@/services";
import { useUptoStyles, UptoPage, UptoHero, UptoSectionHeading, UptoButton, UptoBadge, UptoSpinner, UptoError, UptoCard } from "@/components/UI/UptoHooks";
import { ArrowLeft, Send, Check, X, Download, Printer, FileText, User, Calendar, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMember } = useAuth();
  const s = useUptoStyles();
  const { darkMode } = s;
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const q = await quoteService.get(id);
      setQuote(q);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    try {
      await quoteService.updateStatus(id, status);
      toast.success(`Quote marked as ${status.toLowerCase()}`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <UptoPage><UptoSpinner /></UptoPage>;
  if (error) return <UptoPage><UptoError error={error} onRetry={load} /></UptoPage>;
  if (!quote) return null;

  return (
    <UptoPage className="print:bg-white print:p-0 print:m-0">
      {/* Non-print Header & Actions */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <UptoButton variant="ghost" onClick={() => navigate("/quotes")} className="-ml-4">
          <ArrowLeft className="h-4 w-4" /> Back to Quotes
        </UptoButton>
        <div className="flex gap-2">
          <UptoButton variant="secondary" onClick={handlePrint} className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
            <Printer className="h-4 w-4" /> Print / PDF
          </UptoButton>
          {isMember && (quote.status === "DRAFT" || quote.status === "SENT") && (
            <UptoButton onClick={() => updateStatus("SENT")}>
              <Send className="h-4 w-4" /> {quote.status === "SENT" ? "Resend" : "Send"}
            </UptoButton>
          )}
          {isMember && (quote.status === "SENT" || quote.status === "VIEWED") && (
            <>
              <UptoButton onClick={() => updateStatus("ACCEPTED")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Check className="h-4 w-4" /> Accept
              </UptoButton>
              <UptoButton onClick={() => updateStatus("REJECTED")} variant="danger">
                <X className="h-4 w-4" /> Reject
              </UptoButton>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 print:block print:w-full">
        <div className="lg:col-span-2 space-y-6 print:space-y-4 print:col-span-3">
          
          {/* Printable Quote Document */}
          <div className={`rounded-2xl p-8 border ${s.card} print:border-none print:shadow-none print:p-0`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className={`text-3xl font-bold ${s.heading} print:text-black`}>{quote.title}</h1>
                <p className={`mt-2 font-mono text-sm ${s.subtext} print:text-gray-600`}>{quote.number}</p>
              </div>
              <div className="text-right print:hidden">
                <UptoBadge tone={quote.status === "ACCEPTED" ? "success" : quote.status === "REJECTED" ? "danger" : quote.status === "EXPIRED" ? "danger" : "default"}>
                  {quote.status}
                </UptoBadge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 border-y py-6 border-slate-100 dark:border-slate-800 print:border-gray-200">
              <div>
                <h3 className={`text-xs uppercase font-semibold ${s.subtext} mb-2 print:text-gray-500`}>Prepared For</h3>
                <p className={`font-medium ${s.heading} print:text-black`}>{quote.dealId ? `Deal #${quote.dealId}` : 'Customer'}</p>
                {/* Additional customer details would go here if joined from deal/contact */}
              </div>
              <div className="text-right">
                <h3 className={`text-xs uppercase font-semibold ${s.subtext} mb-2 print:text-gray-500`}>Prepared By</h3>
                <p className={`font-medium ${s.heading} print:text-black`}>{quote.createdBy?.name || "Salesforge Team"}</p>
                <p className={`text-sm ${s.body} print:text-gray-700`}>{quote.createdBy?.email}</p>
              </div>
            </div>

            <div className="mb-8">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={`border-b ${s.divider} print:border-gray-300`}>
                    <th className={`py-3 font-semibold ${s.heading} print:text-black`}>Item</th>
                    <th className={`py-3 text-right font-semibold ${s.heading} print:text-black`}>Qty</th>
                    <th className={`py-3 text-right font-semibold ${s.heading} print:text-black`}>Price</th>
                    <th className={`py-3 text-right font-semibold ${s.heading} print:text-black`}>Total</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${s.divider} print:divide-gray-200`}>
                  {quote.items?.map((item) => (
                    <tr key={item.id}>
                      <td className={`py-4 ${s.body} print:text-black`}>
                        <p className="font-medium">{item.name}</p>
                        {item.description && <p className="text-xs opacity-80 mt-1">{item.description}</p>}
                      </td>
                      <td className={`py-4 text-right ${s.body} print:text-black`}>{item.quantity}</td>
                      <td className={`py-4 text-right ${s.body} print:text-black`}>${(item.unitPrice || 0).toLocaleString()}</td>
                      <td className={`py-4 text-right font-medium ${s.heading} print:text-black`}>${(item.total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!quote.items || quote.items.length === 0) && (
                    <tr>
                      <td colSpan="4" className={`py-4 text-center text-sm ${s.muted}`}>No items added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-6 print:border-gray-300">
              <div className="w-64 space-y-3">
                <div className={`flex justify-between text-sm ${s.body} print:text-gray-700`}>
                  <span>Subtotal</span>
                  <span>${(quote.subtotal || 0).toLocaleString()}</span>
                </div>
                {(quote.discount > 0) && (
                  <div className={`flex justify-between text-sm text-red-500`}>
                    <span>Discount</span>
                    <span>-${(quote.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                {(quote.tax > 0) && (
                  <div className={`flex justify-between text-sm ${s.body} print:text-gray-700`}>
                    <span>Tax</span>
                    <span>${(quote.tax || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className={`flex justify-between text-lg font-bold ${s.heading} pt-3 border-t border-slate-100 dark:border-slate-800 print:border-gray-300 print:text-black`}>
                  <span>Total</span>
                  <span>${(quote.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {(quote.terms || quote.notes) && (
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 print:border-gray-200">
                {quote.terms && (
                  <div className="mb-6">
                    <h4 className={`text-sm font-semibold mb-2 ${s.heading} print:text-black`}>Terms & Conditions</h4>
                    <p className={`text-sm whitespace-pre-wrap ${s.body} print:text-gray-700`}>{quote.terms}</p>
                  </div>
                )}
                {quote.notes && (
                  <div>
                    <h4 className={`text-sm font-semibold mb-2 ${s.heading} print:text-black`}>Notes</h4>
                    <p className={`text-sm whitespace-pre-wrap ${s.body} print:text-gray-700`}>{quote.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info & Timeline - Hidden in Print */}
        <div className="space-y-6 print:hidden">
          <UptoCard>
            <h3 className={`font-semibold mb-4 ${s.heading}`}>Details</h3>
            <div className="space-y-4">
              <div>
                <p className={`text-xs ${s.subtext}`}>Created</p>
                <p className={`text-sm font-medium ${s.body}`}>{new Date(quote.createdAt).toLocaleDateString()}</p>
              </div>
              {quote.validUntil && (
                <div>
                  <p className={`text-xs ${s.subtext}`}>Valid Until</p>
                  <p className={`text-sm font-medium ${s.body}`}>{new Date(quote.validUntil).toLocaleDateString()}</p>
                </div>
              )}
              {quote.currency && (
                <div>
                  <p className={`text-xs ${s.subtext}`}>Currency</p>
                  <p className={`text-sm font-medium ${s.body}`}>{quote.currency}</p>
                </div>
              )}
            </div>
          </UptoCard>

          <UptoCard>
            <h3 className={`font-semibold mb-4 ${s.heading}`}>Status History</h3>
            <div className="relative pl-4 border-l border-slate-200 dark:border-slate-700 space-y-6">
              {quote.events?.length > 0 ? quote.events.map((evt, idx) => (
                <div key={evt.id} className="relative">
                  <div className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    evt.type === 'ACCEPTED' ? 'bg-emerald-500' : 
                    evt.type === 'REJECTED' ? 'bg-red-500' : 
                    evt.type === 'SENT' ? 'bg-blue-500' : 'bg-[#00b5ad]'
                  }`} />
                  <p className={`text-sm font-medium capitalize ${s.heading}`}>{evt.type.toLowerCase()}</p>
                  <p className={`text-xs mt-0.5 ${s.subtext}`}>
                    {new Date(evt.createdAt).toLocaleDateString()} {new Date(evt.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                  {evt.actor && <p className={`text-xs mt-1 ${s.muted}`}>by {evt.actor}</p>}
                </div>
              )) : (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-gray-400" />
                  <p className={`text-sm font-medium ${s.heading}`}>Draft Created</p>
                  <p className={`text-xs mt-0.5 ${s.subtext}`}>{new Date(quote.createdAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </UptoCard>
        </div>
      </div>
    </UptoPage>
  );
};

export default QuoteDetail;
