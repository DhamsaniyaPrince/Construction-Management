import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";

const Auth = () => {
  const [isSignup, setIsSignup] = useState(true);
  const [error, setError] = useState("");
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");
      if (!credentialResponse?.credential) {
        setError("No credential received from Google");
        return;
      }
      await googleLogin(credentialResponse.credential);
      navigate("/");
    } catch (err) {
      console.error("Google login error:", err);
      setError(err?.response?.data?.message || err?.message || "Authentication failed");
    }
  };

  const handleGoogleError = (error) => {
    console.error("Google OAuth error:", error);
    setError("Google authentication failed. Please try again.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-4 text-center font-semibold transition-all ${
              !isSignup
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setIsSignup(false)}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-4 text-center font-semibold transition-all ${
              isSignup
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setIsSignup(true)}
          >
            Sign Up
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-gray-600 mb-6 text-center">Construction Management System</p>

          {error && <ErrorAlert message={error} />}

          {googleClientId ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  text={isSignup ? "signup_with" : "signin_with"}
                />
              </div>
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>
                  {isSignup 
                    ? "Sign up quickly with your Google account" 
                    : "Sign in with your Google account"}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 text-center">
                ⚠️ Google OAuth is not configured. Please add <code className="bg-yellow-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to your <code className="bg-yellow-100 px-1 rounded">frontend/.env</code> file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
