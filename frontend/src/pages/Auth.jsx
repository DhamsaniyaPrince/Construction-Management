import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorAlert from "../components/ErrorAlert";
import { useAuth } from "../context/AuthContext";

const Auth = () => {
  const [isSignup, setIsSignup] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "contractor",
    phone: ""
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [googleRole, setGoogleRole] = useState("contractor");
  const { googleLogin, signup, login } = useAuth();
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Clear form when switching between sign in/sign up
  const handleTabSwitch = (signup) => {
    setIsSignup(signup);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "contractor",
      phone: ""
    });
    setLoginData({
      email: "",
      password: ""
    });
    setError("");
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");
      if (!credentialResponse?.credential) {
        setError("No credential received from Google");
        return;
      }
      const data = await googleLogin(credentialResponse.credential, isSignup ? googleRole : undefined);
      // Redirect based on user role
      if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError(err?.response?.data?.message || err?.message || "Authentication failed");
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginInputChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const data = await login(loginData.email, loginData.password);
      setLoginData({
        email: "",
        password: ""
      });
      // Redirect based on user role
      if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.response?.data?.message || err?.message || "Login failed");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await signup(formData);
      // Clear form after successful signup
      setFormData({
        name: "",
        email: "",
        password: "",
        role: formData.role, // Preserve the selected role
        phone: ""
      });
      navigate("/"); // Let App.jsx handle role-based redirection
    } catch (err) {
      console.error("Signup error:", err);
      setError(err?.response?.data?.message || err?.message || "Signup failed");
    }
  };

  const handleGoogleError = (error) => {
    console.error("Google OAuth error:", error);
    setError("Google authentication failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#eff6ff]"> {/* Very light blue background */}
        
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] overflow-hidden">
        {/* Tabs */}
        <div className="flex p-2 bg-gray-50 border-b border-gray-100">
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              !isSignup
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => handleTabSwitch(false)}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              isSignup
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => handleTabSwitch(true)}
          >
            Sign Up
          </button>
        </div>

        <div className="p-8 pt-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isSignup ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-sm text-gray-500">ContractorHub</p>
          </div>

          {error && <ErrorAlert message={error} />}

          {isSignup ? (
            <form onSubmit={handleSignup} className="space-y-5">
              
              {/* Role Selection First per design */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Select Your Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="contractor">Contractor</option>
                  <option value="site_manager">Site Manager</option>
                  <option value="engineer">Engineer</option>
                </select>
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder={`enter ${formData.role} name`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="enter gmail"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="enter password"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm"
              >
                Create Account
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500 text-xs uppercase tracking-wider">Or</span>
                </div>
              </div>

              {/* Google Role Selection for Signup */}
              {isSignup && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Select Your Role for Google Signup
                  </label>
                  <select
                    value={googleRole}
                    onChange={(e) => setGoogleRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="contractor">Contractor</option>
                    <option value="site_manager">Site Manager</option>
                    <option value="engineer">Engineer</option>
                  </select>
                </div>
              )}

              {googleClientId && (
                <div className="flex flex-col items-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    shape="rectangular"
                  />
                   <p className="text-xs text-gray-400 mt-2">Sign up with your Google account</p>
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-5">
               {/* Login Form Implementation */}
               <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                      placeholder="enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginInputChange}
                      required
                      minLength="6"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                      placeholder="enter your password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm"
                  >
                    Sign In
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500 text-xs uppercase tracking-wider">Or</span>
                    </div>
                  </div>

                  {googleClientId ? (
                    <div className="flex flex-col items-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap={false}
                        width="100%"
                      />
                      <p className="text-xs text-gray-400 mt-4">Sign in with your Google account</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded text-amber-800 text-sm text-center">
                        Google Config Missing
                    </div>
                  )}
               </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
