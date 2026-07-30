import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';
import logoFpt from '../assets/fpt.jpg';

async function uploadImageFile(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await axiosClient.post('/upload/student-card', form, {
        headers: { 'Content-Type': undefined },
    });
    return res.result;
}

function getFileName(file) {
    if (!file) return '';
    return file.name;
}

function isFptStudentEmail(email) {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized.endsWith('@fpt.edu.vn')) return false;
    const username = normalized.substring(0, normalized.indexOf('@'));
    return /^.*[a-z]{2}\d{6}$/.test(username);
}

export default function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Verify Email, 2: Student Info, 3: Password Setup
    const [loading, setLoading] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [otpSuccess, setOtpSuccess] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [studentCardFile, setStudentCardFile] = useState(null);
    const [studentCardPreview, setStudentCardPreview] = useState('');
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        studentId: '',
        isFptStudent: true,
        universityName: 'FPT University',
        otp: '',
    });

    const handleStudentCardUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            setStudentCardFile(null);
            setStudentCardPreview('');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setFieldErrors((curr) => ({
                ...curr,
                studentCard: 'Only image files (.jpg, .png, .webp) are accepted.',
            }));
            event.target.value = '';
            return;
        }

        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!allowedExtensions.includes(ext)) {
            setFieldErrors((curr) => ({
                ...curr,
                studentCard: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
            }));
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setFieldErrors((curr) => ({
                ...curr,
                studentCard: 'Student card image cannot exceed 5MB.',
            }));
            event.target.value = '';
            return;
        }

        if (studentCardPreview) {
            URL.revokeObjectURL(studentCardPreview);
        }
        const previewUrl = URL.createObjectURL(file);
        setStudentCardFile(file);
        setStudentCardPreview(previewUrl);
        setFieldErrors((curr) => ({ ...curr, studentCard: '' }));
    };

    const handleSendOtp = async () => {
        setFieldErrors((curr) => ({ ...curr, email: '' }));
        setOtpSuccess('');
        setError('');
        if (!formData.email) {
            setFieldErrors((curr) => ({ ...curr, email: 'Please enter your email first.' }));
            return;
        }

        setSendingOtp(true);
        try {
            const response = await axiosClient.post('/auth/send-otp', { email: formData.email });
            setOtpSent(true);
            setOtpSuccess(response.result || 'Verification code sent to your email.');
        } catch (err) {
            setFieldErrors((curr) => ({ ...curr, email: err.message || 'Could not send verification code.' }));
        } finally {
            setSendingOtp(false);
        }
    };

    const handleNextStep1 = async () => {
        setFieldErrors({});
        setError('');
        const errors = {};
        let hasErr = false;

        const nameTrimmed = formData.fullName.trim();
        if (!nameTrimmed) {
            errors.fullName = 'Please enter your full name.';
            hasErr = true;
        } else if (nameTrimmed.split(/\s+/).length < 2) {
            errors.fullName = 'Full name must contain at least 2 words (e.g. Nguyen Van A).';
            hasErr = true;
        } else if (/\d/.test(nameTrimmed)) {
            errors.fullName = 'Full name cannot contain numbers.';
            hasErr = true;
        }

        const emailTrimmed = formData.email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailTrimmed) {
            errors.email = 'Please enter your email address.';
            hasErr = true;
        } else if (!emailRegex.test(emailTrimmed)) {
            errors.email = 'Invalid email address format.';
            hasErr = true;
        } else if (!otpSent) {
            errors.email = 'Please click "Send Code" to request an OTP code first.';
            hasErr = true;
        }

        const otpVal = formData.otp.trim();
        if (!otpVal) {
            errors.otp = 'Please enter the verification code sent to your email.';
            hasErr = true;
        } else if (!/^\d{6}$/.test(otpVal)) {
            errors.otp = 'OTP code must be exactly 6 digits.';
            hasErr = true;
        }

        if (hasErr) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        try {
            await axiosClient.post('/auth/verify-otp', {
                email: emailTrimmed,
                otp: otpVal,
            });
            setStep(2);
        } catch (err) {
            setFieldErrors({ otp: err.message || 'Invalid or expired OTP. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleNextStep2 = () => {
        setFieldErrors({});
        setError('');
        const errors = {};
        let hasErr = false;

        const emailVal = formData.email.trim().toLowerCase();
        const isFptEmail = emailVal.endsWith('@fpt.edu.vn');
        const isFptStudent = isFptEmail ? isFptStudentEmail(emailVal) : formData.isFptStudent;
        const isFptLecturer = isFptEmail && !isFptStudent;

        const sid = formData.studentId.trim();
        if (!isFptLecturer) {
            if (!sid) {
                errors.studentId = 'Please enter your student ID.';
                hasErr = true;
            } else if (sid.length < 4) {
                errors.studentId = 'Student ID must be at least 4 characters long.';
                hasErr = true;
            }
        }

        if (!isFptStudent && !formData.universityName.trim() && !isFptLecturer) {
            errors.universityName = 'Please enter your university name.';
            hasErr = true;
        }

        if (!isFptEmail && !studentCardFile) {
            errors.studentCard = 'Please upload your student ID card image.';
            hasErr = true;
        }

        if (hasErr) {
            setFieldErrors(errors);
            return;
        }
        setStep(3);
    };

    const handleNext = () => {
        if (step === 1) handleNextStep1();
        else if (step === 2) handleNextStep2();
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setSuccessMessage('');

        const pwErrors = {};
        let pwHasErr = false;

        if (!formData.password) {
            pwErrors.password = 'Please enter your password.';
            pwHasErr = true;
        } else if (formData.password.length < 6) {
            pwErrors.password = 'Password must be at least 6 characters long.';
            pwHasErr = true;
        }

        if (!formData.confirmPassword) {
            pwErrors.confirmPassword = 'Please confirm your password.';
            pwHasErr = true;
        } else if (formData.password !== formData.confirmPassword) {
            pwErrors.confirmPassword = 'Passwords do not match.';
            pwHasErr = true;
        }

        if (pwHasErr) {
            setFieldErrors(pwErrors);
            return;
        }

        setLoading(true);
        try {
            let uploadedCardUrl = '';
            if (studentCardFile) {
                setUploading(true);
                uploadedCardUrl = await uploadImageFile(studentCardFile);
                setUploading(false);
            }

            const emailVal = formData.email.trim().toLowerCase();
            const isFptEmail = emailVal.endsWith('@fpt.edu.vn');
            
            let finalIsFptStudent = formData.isFptStudent;
            if (isFptEmail) {
                finalIsFptStudent = isFptStudentEmail(emailVal);
            }

            const response = await axiosClient.post('/auth/register', {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                studentId: formData.studentId,
                isFptStudent: finalIsFptStudent,
                universityName: isFptEmail
                    ? (finalIsFptStudent ? 'FPT University' : 'FPT University (Lecturer)')
                    : (formData.isFptStudent ? 'FPT University' : formData.universityName),
                studentCardUrl: uploadedCardUrl,
                otp: formData.otp,
            });

            setSuccessMessage(response.result || 'Registration successful.');
            if (studentCardPreview) URL.revokeObjectURL(studentCardPreview);
            setTimeout(() => {
                navigate('/login');
            }, 2500);
        } catch (err) {
            setUploading(false);
            setError(err.message || 'An error occurred during registration. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="devpost-auth devpost-auth--login">
            <section className="devpost-auth__story">
                <Link to="/" className="flex items-center gap-3 relative z-10 mb-8 lg:mb-0">
                    <img src={logoFpt} alt="FPT Logo" style={{ width: '60px', height: '45px' }} className="object-contain" />
                    <div className="h-10 border-l border-slate-300"></div>
                    <div className="flex flex-col relative -top-[1px]">
                        <span className="text-[32px] font-black leading-none text-slate-900 brand-mark-text">seal.</span>
                        <span className="text-[16px] font-black uppercase leading-none tracking-widest text-[#2c4e66] mt-1">Hackathon</span>
                    </div>
                </Link>
                <div>
                    <p>The student hackathon platform</p>
                    <h1>Create Profile.<br />Find Teammates.<br />Start Building.</h1>
                    <span>A student profile ensures your credentials, team records, and awards are archived across all seasons.</span>
                </div>
                <ul>
                    <li style={{ opacity: step === 1 ? 1 : 0.5, fontWeight: step === 1 ? '500' : '300' }}>
                        <strong>01</strong>Verify Account
                    </li>
                    <li style={{ opacity: step === 2 ? 1 : 0.5, fontWeight: step === 2 ? '500' : '300' }}>
                        <strong>02</strong>Student Details
                    </li>
                    <li style={{ opacity: step === 3 ? 1 : 0.5, fontWeight: step === 3 ? '500' : '300' }}>
                        <strong>03</strong>Set Password
                    </li>
                </ul>
            </section>

            <section className="devpost-auth__form-panel" aria-labelledby="register-title">
                <div className="devpost-auth__form-wrap">
                    
                    {/* Step progress bar */}
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#2c4e66]">
                            Step {step}/3
                        </span>
                        <div className="flex gap-1.5 ml-auto">
                            <span className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${step >= 1 ? 'bg-[#2c4e66]' : 'bg-slate-200'}`} />
                            <span className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${step >= 2 ? 'bg-[#2c4e66]' : 'bg-slate-200'}`} />
                            <span className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${step >= 3 ? 'bg-[#2c4e66]' : 'bg-slate-200'}`} />
                        </div>
                    </div>

                    <p className="devpost-auth__eyebrow">Sign Up</p>
                    <h1 id="register-title">
                        {step === 1 && 'Create Account'}
                        {step === 2 && 'Student Information'}
                        {step === 3 && 'Set Password'}
                    </h1>
                    <span className="devpost-auth__copy">
                        {step === 1 && 'Enter your name, email, and verify with OTP.'}
                        {step === 2 && 'Provide your student ID and credentials.'}
                        {step === 3 && 'Secure your account with a strong password.'}
                    </span>

                    <Toast error={error} success={successMessage} onClose={() => { setError(''); setSuccessMessage(''); }} />

                    <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
                        
                        {/* ================= STEP 1: VERIFY EMAIL ================= */}
                        {step === 1 && (
                            <>
                                <label htmlFor="register-name">Full Name</label>
                                <input
                                    id="register-name"
                                    required
                                    type="text"
                                    placeholder="Nguyen Van A"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                                {fieldErrors.fullName && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.fullName}</p>}

                                <label htmlFor="register-email">Email Address</label>
                                <div className="flex gap-3 items-center mb-4">
                                    <input
                                        required
                                        id="register-email"
                                        type="email"
                                        placeholder="example@fpt.edu.vn"
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData({ ...formData, email: e.target.value });
                                            setOtpSent(false);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={sendingOtp}
                                        className="btn-secondary h-[42px] px-4 whitespace-nowrap text-xs font-bold w-auto"
                                    >
                                        {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
                                    </button>
                                </div>
                                {fieldErrors.email && <p className="text-red-500 text-xs font-bold -mt-3 mb-2">{fieldErrors.email}</p>}
                                {otpSuccess && <p className="text-emerald-600 text-xs font-bold -mt-3 mb-2">{otpSuccess}</p>}

                                <label htmlFor="register-otp">Verification Code (OTP)</label>
                                <input
                                    id="register-otp"
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="6"
                                    placeholder="Enter 6-digit code"
                                    value={formData.otp}
                                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                />
                                {fieldErrors.otp && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.otp}</p>}
                            </>
                        )}

                        {/* ================= STEP 2: STUDENT DETAILS ================= */}
                        {step === 2 && (() => {
                            const emailVal = formData.email.trim().toLowerCase();
                            const isFptEmail = emailVal.endsWith('@fpt.edu.vn');
                            const isFptStudent = isFptEmail ? isFptStudentEmail(emailVal) : formData.isFptStudent;
                            const isFptLecturer = isFptEmail && !isFptStudent;

                            return (
                                <>
                                    {!isFptLecturer ? (
                                        <>
                                            <label htmlFor="register-student-id">Student ID</label>
                                            <input
                                                id="register-student-id"
                                                required
                                                type="text"
                                                placeholder="SE170001"
                                                value={formData.studentId}
                                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            />
                                            {fieldErrors.studentId && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.studentId}</p>}
                                        </>
                                    ) : (
                                        <>
                                            <label htmlFor="register-student-id">Staff ID (Optional)</label>
                                            <input
                                                id="register-student-id"
                                                type="text"
                                                placeholder="Your FPT staff ID"
                                                value={formData.studentId}
                                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            />
                                            {fieldErrors.studentId && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.studentId}</p>}
                                        </>
                                    )}

                                    {!isFptEmail && (
                                        <div className="flex items-center gap-2 my-4">
                                            <input
                                                type="checkbox"
                                                id="isFpt"
                                                className="h-4.5 w-4.5 m-0 accent-[#2c4e66] cursor-pointer"
                                                checked={formData.isFptStudent}
                                                onChange={(e) => setFormData({ ...formData, isFptStudent: e.target.checked })}
                                            />
                                            <label htmlFor="isFpt" className="m-0 cursor-pointer font-bold text-sm text-[#2c4e66]">
                                                I am an FPT University student
                                            </label>
                                        </div>
                                    )}

                                    {!isFptEmail && !formData.isFptStudent && (
                                        <>
                                            <label htmlFor="register-university">University Name</label>
                                            <input
                                                id="register-university"
                                                required
                                                type="text"
                                                placeholder="Enter university name"
                                                value={formData.universityName}
                                                onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                                            />
                                            {fieldErrors.universityName && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.universityName}</p>}
                                        </>
                                    )}

                                    {!isFptEmail && (
                                        <>
                                            <label htmlFor="register-card">Student ID Card Photo (Required)</label>
                                            <label
                                                htmlFor="register-card"
                                                className="student-card-upload-label mb-4 cursor-pointer"
                                            >
                                                {studentCardFile ? (
                                                    <div className="flex items-center gap-3">
                                                        <svg className="h-6 w-6 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <div className="text-left leading-normal">
                                                            <p className="text-sm font-bold text-emerald-800 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap m-0">
                                                                {getFileName(studentCardFile)}
                                                            </p>
                                                            <p className="text-xs text-emerald-600 m-0">
                                                                {(studentCardFile.size / 1024).toFixed(0)} KB (Click to change)
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <svg className="h-7 w-7 text-[#2c4e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                        </svg>
                                                        <p className="text-sm font-bold text-[#2c4e66] m-0">Upload student ID card photo</p>
                                                        <p className="text-xs text-gray-500 m-0">Supports JPG, PNG, WEBP (Max 5MB)</p>
                                                    </>
                                                )}
                                            </label>
                                            <input
                                                id="register-card"
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
                                                className="sr-only"
                                                onChange={handleStudentCardUpload}
                                            />
                                            {fieldErrors.studentCard && <p className="text-red-500 text-xs font-bold -mt-2 mb-2">{fieldErrors.studentCard}</p>}
                                        </>
                                    )}
                                </>
                            );
                        })()}

                        {/* ================= STEP 3: SET PASSWORD ================= */}
                        {step === 3 && (
                            <>
                                <label htmlFor="register-password">Password</label>
                                <input
                                    id="register-password"
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                {fieldErrors.password && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.password}</p>}

                                <label htmlFor="register-confirm-password">Confirm Password</label>
                                <input
                                    id="register-confirm-password"
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                                {fieldErrors.confirmPassword && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.confirmPassword}</p>}
                            </>
                        )}

                        {/* ================= NAVIGATION CONTROLS ================= */}
                        <div className="flex gap-3 mt-5">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    disabled={loading || uploading}
                                    className="btn-secondary flex-1 w-full"
                                >
                                    Back
                                </button>
                            )}
                            
                            <button
                                type={step === 3 ? 'submit' : 'button'}
                                onClick={step < 3 ? handleNext : undefined}
                                disabled={loading || uploading}
                                className="btn-primary flex-1 w-full"
                            >
                                {step < 3 ? (
                                    'Continue'
                                ) : uploading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Registering...
                                    </span>
                                ) : loading ? (
                                    'Processing...'
                                ) : (
                                    'Sign Up'
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="devpost-auth__switch">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
