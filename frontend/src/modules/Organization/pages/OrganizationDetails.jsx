import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Users, Link, Loader2, Edit, AlertTriangle, Building2, Globe, Mail, Briefcase, Calendar } from 'lucide-react';
import OrganizationService from '../services/organizationService';
import { useTheme } from '../../../context/ThemeContext';

// --- UPTOSKILLS BRAND COLORS ---
const COLORS = {
    primary: '#00c6b6',
    primaryDark: '#009999',                                                                
    primaryLight: '#1ae0d0',
    primaryLighter: '#4de8dc',
    primaryUltraLight: '#80f0e8',
    text: '#333333',
    textLight: '#666666',
    border: '#e0e0e0',
    background: '#f8fafb',
    white: '#ffffff',
};

// --- ENHANCED ANIMATIONS ---
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes gradient-shift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(0, 198, 182, 0.4);
    }
    50% {
      box-shadow: 0 0 40px rgba(0, 198, 182, 0.7);
    }
  }

  .fade-in-up {
    animation: fadeInUp 0.8s ease-out;
  }

  .slide-in-right {
    animation: slideInRight 0.8s ease-out;
  }

  .scale-in {
    animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .float-animation {
    animation: float 6s ease-in-out infinite;
  }

  .gradient-background {
    background: linear-gradient(135deg, rgba(0, 198, 182, 0.05) 0%, rgba(0, 153, 153, 0.08) 50%, rgba(26, 224, 208, 0.05) 100%);
    background-size: 200% 200%;
    animation: gradient-shift 15s ease infinite;
    position: relative;
    overflow: hidden;
  }

  .gradient-background::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 198, 182, 0.1) 0%, transparent 70%);
    animation: float 20s ease-in-out infinite;
  }

  .gradient-background::after {
    content: '';
    position: absolute;
    bottom: -30%;
    right: -30%;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle, rgba(26, 224, 208, 0.08) 0%, transparent 70%);
    animation: float 15s ease-in-out infinite reverse;
  }

  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 198, 182, 0.2);
  }

  .detail-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .detail-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 198, 182, 0.15);
  }

  .pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    .gradient-background::before,
    .gradient-background::after {
      display: none;
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Reusable component for displaying status
const StatusBadge = ({ status, darkMode }) => {
    const baseClasses = "px-4 py-2 text-sm font-bold rounded-full min-w-[90px] text-center transition-all duration-300 transform hover:scale-110";
    let style = {};
    
    switch (status) {
        case 'Active': 
            style = {
                backgroundColor: darkMode ? "rgba(45, 212, 191, 0.14)" : `${COLORS.primary}20`,
                color: darkMode ? "#5eead4" : COLORS.primaryDark,
                border: darkMode ? "2px solid rgba(45, 212, 191, 0.26)" : `2px solid ${COLORS.primary}40`
            };
            break;
        case 'Pending': 
            style = {
                backgroundColor: darkMode ? "rgba(45, 212, 191, 0.1)" : `${COLORS.primaryLight}20`,
                color: darkMode ? "#99f6e4" : COLORS.primaryDark,
                border: darkMode ? "2px solid rgba(45, 212, 191, 0.2)" : `2px solid ${COLORS.primaryLight}40`
            };
            break;
        case 'Closed': 
            style = {
                backgroundColor: darkMode ? "rgba(239, 68, 68, 0.16)" : '#fee2e2',
                color: darkMode ? "#fca5a5" : '#dc2626',
                border: darkMode ? "2px solid rgba(248, 113, 113, 0.22)" : '2px solid #fecaca'
            };
            break;
        default: 
            style = {
                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.12)" : `${COLORS.primary}10`,
                color: darkMode ? "#e2e8f0" : COLORS.text,
                border: darkMode ? "2px solid rgba(148, 163, 184, 0.18)" : `2px solid ${COLORS.border}`
            };
    }
    
    return <span className={baseClasses} style={style}>{status}</span>;
};


const OrganizationDetails = () => {
    // In a real app, you would use useParams() to get the ID from the URL
    const { id } = useParams();
    const { theme } = useTheme();
    const darkMode = theme === 'dark';
    const [organization, setOrganization] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const tokens = {
        pageBackground: darkMode
            ? `radial-gradient(circle at 12% 16%, rgba(45, 212, 191, 0.08), transparent 40%),
               radial-gradient(circle at 88% 84%, rgba(20, 184, 166, 0.07), transparent 45%),
               #020617`
            : `radial-gradient(circle at 12% 16%, rgba(0, 198, 182, 0.08), transparent 40%),
               radial-gradient(circle at 88% 84%, rgba(26, 224, 208, 0.08), transparent 45%),
               #f8fafb`,
        panelBackground: darkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.95)",
        panelBorder: darkMode ? "rgba(45, 212, 191, 0.18)" : `${COLORS.primary}30`,
        panelShadow: darkMode ? "0 20px 48px rgba(2, 6, 23, 0.55)" : "0 10px 40px rgba(0, 198, 182, 0.15)",
        detailBackground: darkMode ? "rgba(15, 23, 42, 0.7)" : `${COLORS.primary}08`,
        accentBackground: darkMode ? "rgba(45, 212, 191, 0.16)" : `${COLORS.primary}20`,
        headingGradient: darkMode
            ? "linear-gradient(135deg, #5eead4 0%, #14b8a6 100%)"
            : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
        text: darkMode ? "#e2e8f0" : COLORS.text,
        textMuted: darkMode ? "#94a3b8" : COLORS.textLight,
        buttonColor: darkMode ? "#14b8a6" : COLORS.primary,
        buttonHover: darkMode ? "#0f766e" : COLORS.primaryDark,
        errorBackground: darkMode ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.95)",
    };

    const fetchDetails = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await OrganizationService.getOrganizationDetails(id);
            setOrganization(data);
        } catch (err) {
            setError("Failed to load organization details.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-10 transition-colors duration-300" style={{ background: tokens.pageBackground }}>
                <div className="pulse-glow mb-4 rounded-3xl p-6" style={{ backgroundColor: tokens.accentBackground }}>
                    <Loader2 className="animate-spin" size={48} style={{ color: COLORS.primary }} />
                </div>
                <p className="mb-2 text-xl font-bold" style={{ color: tokens.text }}>Loading organization details...</p>
                <p className="text-sm" style={{ color: tokens.textMuted }}>Please wait while we fetch the information</p>
            </div>
        );
    }

    if (error || !organization) {
        return (
            <div className="min-h-screen flex items-center justify-center p-10 transition-colors duration-300" style={{ background: tokens.pageBackground }}>
                <div
                    className="scale-in max-w-md rounded-3xl border p-10 text-center shadow-2xl"
                    style={{
                        background: tokens.errorBackground,
                        backdropFilter: 'blur(14px)',
                        borderColor: '#ef4444',
                    }}
                >
                    <div className="p-4 rounded-full bg-red-100 mb-4 inline-block">
                        <AlertTriangle className="text-red-600" size={48} />
                    </div>
                    <p className="text-xl font-bold mb-2 text-red-600">{error || "Organization not found."}</p>
                    <p className="text-sm" style={{ color: tokens.textMuted }}>Please check the organization ID and try again</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative mx-auto min-h-screen max-w-6xl space-y-8 p-4 transition-colors duration-300 md:p-8"
            style={{ background: tokens.pageBackground }}
        >
            {/* Animated Background Elements */}
            <div className="hidden md:block absolute top-20 right-10 w-96 h-96 rounded-full opacity-20 float-animation" style={{ 
                background: darkMode
                    ? "radial-gradient(circle, rgba(45, 212, 191, 0.35) 0%, transparent 70%)"
                    : `radial-gradient(circle, ${COLORS.primaryLight} 0%, transparent 70%)`,
                filter: 'blur(80px)'
            }}></div>
            <div className="hidden md:block absolute bottom-20 left-10 w-72 h-72 rounded-full opacity-15 float-animation" style={{ 
                background: darkMode
                    ? "radial-gradient(circle, rgba(20, 184, 166, 0.32) 0%, transparent 70%)"
                    : `radial-gradient(circle, ${COLORS.primary} 0%, transparent 70%)`,
                filter: 'blur(60px)',
                animationDelay: '2s'
            }}></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b-2 relative z-10 fade-in-up" 
                 style={{ borderColor: `${COLORS.primary}30` }}>
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl pulse-glow" style={{ backgroundColor: tokens.accentBackground }}>
                        <Building2 size={32} style={{ color: COLORS.primary }} />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-2" style={{ 
                            backgroundImage: tokens.headingGradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            color: COLORS.primary
                        }}>
                            {organization.name}
                        </h1>
                        <p className="text-sm font-medium" style={{ color: tokens.textMuted }}>Organization Details</p>
                    </div>
                </div>
                <button
                    className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-110 shadow-xl hover:shadow-2xl"
                    style={{
                        backgroundColor: tokens.buttonColor,
                        boxShadow: darkMode ? "0 8px 20px rgba(20, 184, 166, 0.3)" : `0 8px 20px ${COLORS.primary}40`
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = tokens.buttonHover;
                        e.currentTarget.style.boxShadow = darkMode ? "0 12px 30px rgba(20, 184, 166, 0.42)" : `0 12px 30px ${COLORS.primary}60`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = tokens.buttonColor;
                        e.currentTarget.style.boxShadow = darkMode ? "0 8px 20px rgba(20, 184, 166, 0.3)" : `0 8px 20px ${COLORS.primary}40`;
                    }}
                    onClick={() => console.log(`Attempting to edit organization ${organization.id}`)}
                >
                    <Edit size={18} />
                    Edit Record
                </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-6 rounded-3xl border-2 p-8 shadow-2xl relative z-10 scale-in transition-colors duration-300 md:grid-cols-2" 
                 style={{ 
                     background: tokens.panelBackground,
                     backdropFilter: 'blur(14px)',
                     borderColor: tokens.panelBorder,
                     borderTop: `4px solid ${COLORS.primary}`,
                     boxShadow: tokens.panelShadow
                 }}>

                {/* Status */}
                <div className="detail-card rounded-2xl p-5" style={{ backgroundColor: tokens.detailBackground }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-xl p-2.5" style={{ backgroundColor: tokens.accentBackground }}>
                            <Briefcase size={20} style={{ color: COLORS.primary }} />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>Status</p>
                    </div>
                    <StatusBadge status={organization.type} darkMode={darkMode} />
                </div>

                {/* Created Date */}
                <div className="detail-card rounded-2xl p-5" style={{ backgroundColor: tokens.detailBackground }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-xl p-2.5" style={{ backgroundColor: tokens.accentBackground }}>
                            <Calendar size={20} style={{ color: COLORS.primary }} />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>Date Created</p>
                    </div>
                    <p className="text-base font-bold" style={{ color: tokens.text }}>
                        {new Date(organization.created).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>

                {/* Website */}
                <div className="detail-card rounded-2xl p-5" style={{ backgroundColor: tokens.detailBackground }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-xl p-2.5" style={{ backgroundColor: tokens.accentBackground }}>
                            <Globe size={20} style={{ color: COLORS.primary }} />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>Website</p>
                    </div>
                    <a 
                        href={`http://${organization.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 text-base font-bold transition-all duration-300 hover:underline inline-block"
                        style={{ color: COLORS.primary }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateX(4px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateX(0)'}
                    >
                        <Link size={18} />
                        {organization.website}
                    </a>
                </div>

                {/* Location */}
                <div className="detail-card rounded-2xl p-5" style={{ backgroundColor: tokens.detailBackground }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-xl p-2.5" style={{ backgroundColor: tokens.accentBackground }}>
                            <MapPin size={20} style={{ color: COLORS.primary }} />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>Location</p>
                    </div>
                    <p className="flex items-center gap-2 text-base font-bold" style={{ color: tokens.text }}>
                        {organization.region}
                    </p>
                </div>

                {/* Contact Email if available */}
                {organization.contactName && (
                    <div className="detail-card rounded-2xl p-5 md:col-span-2" style={{ backgroundColor: tokens.detailBackground }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-xl p-2.5" style={{ backgroundColor: tokens.accentBackground }}>
                                <Mail size={20} style={{ color: COLORS.primary }} />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>Contact Email</p>
                        </div>
                        <a 
                            href={`mailto:${organization.contactName}`}
                            className="flex items-center gap-2 text-base font-bold transition-all duration-300 hover:underline inline-block"
                            style={{ color: COLORS.primary }}
                            onMouseEnter={(e) => e.target.style.transform = 'translateX(4px)'}
                            onMouseLeave={(e) => e.target.style.transform = 'translateX(0)'}
                        >
                            {organization.contactName}
                        </a>
                    </div>
                )}

            </div>

            {/* Placeholder for Contacts/Deals/Logs linked to this Organization */}
            <div className="slide-in-right relative z-10 rounded-3xl border-2 p-8 shadow-2xl transition-colors duration-300" 
                 style={{ 
                     background: tokens.panelBackground,
                     backdropFilter: 'blur(14px)',
                     borderColor: tokens.panelBorder,
                     borderTop: `4px solid ${COLORS.primary}`,
                     boxShadow: tokens.panelShadow
                 }}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="rounded-xl p-3" style={{ backgroundColor: tokens.accentBackground }}>
                        <Users size={24} style={{ color: COLORS.primary }} />
                    </div>
                    <h2 className="text-2xl font-extrabold" style={{ 
                        backgroundImage: tokens.headingGradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: COLORS.primary
                    }}>
                        Related Records
                    </h2>
                </div>
                <div className="rounded-2xl p-6" style={{ backgroundColor: tokens.detailBackground }}>
                    <p className="text-base font-medium" style={{ color: tokens.textMuted }}>
                        Integrate the list of associated contacts, deals, and blockchain logs here.
                    </p>
                </div>
            </div>

        </div>
    );
};

// Export the component as the default export for routing
export default OrganizationDetails;
