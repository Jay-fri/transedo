import React, { useState, useEffect, useRef } from "react";
import "../App.css";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("login");
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [amount, setAmount] = useState(200000);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const printRef = useRef();
  const [profileImage, setProfileImage] = useState(null);
  const [authError, setAuthError] = useState("");
  // Add state for distress mode
  const [distressMode, setDistressMode] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const PAYSTACK_PUBLIC_KEY =
    "pk_test_a8bf821807471ba1d1b437054d5d277b824536ee";

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem("transactions");
    const savedTicket = localStorage.getItem("ticketDetails");
    const loggedInUser = localStorage.getItem("currentUser");

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }

    if (savedTicket) {
      setTicketDetails(JSON.parse(savedTicket));
    }

    if (loggedInUser) {
      const userData = JSON.parse(loggedInUser);
      setUser(userData);
      setProfileImage(userData.profileImage);

      // If user is logged in, redirect to buy ticket page
      setActiveTab("buyTicket");
    }

    // Add Paystack script
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem("transactions", JSON.stringify(transactions));
    }
  }, [transactions]);

  // Generate QR code URL when ticket details change
  useEffect(() => {
    if (ticketDetails) {
      localStorage.setItem("ticketDetails", JSON.stringify(ticketDetails));

      // Generate QR code data
      const ticketData = encodeURIComponent(JSON.stringify(ticketDetails));
      // Using QR code API service that works with any React version
      setQrCodeUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketData}`
      );
    } else {
      // Clear QR code if there's no ticket
      setQrCodeUrl("");
      localStorage.removeItem("ticketDetails");
    }
  }, [ticketDetails]);

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should not exceed 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Handle login submission
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError("");

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    // Find user with matching email and password
    const foundUser = users.find(
      (u) => u.email === loginEmail && u.password === loginPassword
    );

    if (foundUser) {
      // Set current user in localStorage and state
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      setUser(foundUser);
      setProfileImage(foundUser.profileImage);

      // Reset form fields
      setLoginEmail("");
      setLoginPassword("");

      // Redirect to buy ticket page
      setActiveTab("buyTicket");
    } else {
      setAuthError("Invalid email or password");
    }
  };

  // Handle signup submission
  const handleSignup = (e) => {
    e.preventDefault();
    setAuthError("");

    // Basic validation
    if (!signupName || !signupEmail || !signupPhone || !signupPassword) {
      setAuthError("All fields are required");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    // Get existing users from localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    // Check if email already exists
    if (users.some((user) => user.email === signupEmail)) {
      setAuthError("Email already registered");
      return;
    }

    // Create new user object
    const newUser = {
      id: `user-${Date.now()}`,
      name: signupName,
      email: signupEmail,
      phone: signupPhone,
      password: signupPassword,
      profileImage: imagePreview || null,
    };

    // Add new user to users array
    const updatedUsers = [...users, newUser];
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    // Set current user in localStorage and state
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    setUser(newUser);
    setProfileImage(imagePreview);

    // Reset form fields
    setSignupName("");
    setSignupEmail("");
    setSignupPhone("");
    setSignupPassword("");
    setSignupConfirmPassword("");
    setImagePreview(null);

    // Redirect to buy ticket page
    setActiveTab("buyTicket");
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    setProfileImage(null);
    setActiveTab("login");
  };
  // Function to handle distress activation
  const activateDistress = () => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });

          // Show confirmation and activate distress mode
          if (
            window.confirm(
              "Activate emergency mode? This will alert your emergency contacts."
            )
          ) {
            setDistressMode(true);

            // Get emergency contacts
            const savedContacts = JSON.parse(
              localStorage.getItem("emergencyContacts") || "[]"
            );
            setEmergencyContacts(savedContacts);

            // If there are emergency contacts, simulate sending alerts
            if (savedContacts.length > 0) {
              alert(
                `Distress signal sent to ${savedContacts.length} emergency contacts with your location!`
              );
            } else {
              alert(
                "No emergency contacts found. Please add contacts in your profile."
              );
            }
          }
        },
        (error) => {
          console.error("Error getting location:", error);

          // Still activate distress mode even without location
          if (
            window.confirm(
              "Unable to get your location. Activate emergency mode anyway?"
            )
          ) {
            setDistressMode(true);
          }
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      if (window.confirm("Activate emergency mode without location sharing?")) {
        setDistressMode(true);
      }
    }
  };

  // Function to deactivate distress mode
  const deactivateDistress = () => {
    if (window.confirm("Deactivate emergency mode?")) {
      setDistressMode(false);
    }
  };

  // Function to add emergency contact
  const addEmergencyContact = (e) => {
    e.preventDefault();
    const contactName = document.getElementById("emergencyContactName").value;
    const contactPhone = document.getElementById("emergencyContactPhone").value;

    if (!contactName || !contactPhone) {
      alert("Please enter both name and phone number");
      return;
    }

    const newContact = {
      id: Date.now(),
      name: contactName,
      phone: contactPhone,
    };
    const updatedContacts = [...emergencyContacts, newContact];

    setEmergencyContacts(updatedContacts);
    localStorage.setItem("emergencyContacts", JSON.stringify(updatedContacts));

    // Reset form
    document.getElementById("emergencyContactName").value = "";
    document.getElementById("emergencyContactPhone").value = "";

    alert("Emergency contact added successfully!");
  };

  // Function to remove emergency contact
  const removeEmergencyContact = (contactId) => {
    if (window.confirm("Remove this emergency contact?")) {
      const updatedContacts = emergencyContacts.filter(
        (contact) => contact.id !== contactId
      );

      setEmergencyContacts(updatedContacts);
      localStorage.setItem(
        "emergencyContacts",
        JSON.stringify(updatedContacts)
      );
    }
  };

  // Load emergency contacts on component mount
  useEffect(() => {
    const savedContacts = localStorage.getItem("emergencyContacts");

    if (savedContacts) {
      setEmergencyContacts(JSON.parse(savedContacts));
    }
  }, []);

  const handlePaystackSuccess = (reference) => {
    // Create a ticket with expiry date (1 week from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    // Create a unique ticket
    const newTicket = {
      id: `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      reference: reference,
      purchaseDate: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      amount: amount / 100, // Convert back to naira
      isValid: true,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    };

    // Add to transactions
    const newTransaction = {
      id: Date.now(),
      type: "Ticket Purchase",
      amount: amount / 100,
      date: new Date().toISOString(),
      reference: reference,
    };

    setTicketDetails(newTicket);
    setTransactions([newTransaction, ...transactions]);

    // Switch to QR Code tab
    setActiveTab("qrCode");
  };

  // Reset function to clear all data and start fresh
  const resetApp = () => {
    // Clear localStorage
    localStorage.removeItem("transactions");
    localStorage.removeItem("ticketDetails");

    // Reset state
    setTransactions([]);
    setTicketDetails(null);
    setQrCodeUrl("");

    // Navigate to buy ticket tab
    setActiveTab("buyTicket");

    // Show confirmation
    alert("All data has been reset. You can start fresh now.");
  };

  // Function to handle printing
  const handlePrint = () => {
    const printContent = document.getElementById("printable-ticket");
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContent.innerHTML;

    window.print();

    document.body.innerHTML = originalContents;

    // Reattach event listeners by forcing a re-render
    window.location.reload();
  };

  // Function to download as PDF (using browser print to PDF functionality)
  const handleDownload = () => {
    const printContent = document.getElementById("printable-ticket");
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContent.innerHTML;

    window.print();

    document.body.innerHTML = originalContents;

    // Reattach event listeners by forcing a re-render
    window.location.reload();
  };

  // Direct Paystack integration without using react-paystack
  const initializePaystack = () => {
    if (window.PaystackPop) {
      const reference = `ref-${Date.now()}`;
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: amount,
        ref: reference,
        callback: function (response) {
          handlePaystackSuccess(response.reference);
        },
        onClose: function () {
          console.log("Payment window closed");
        },
      });
      handler.openIframe();
    } else {
      alert("Paystack script not loaded yet. Please try again.");
    }
  };

  const isTicketValid = () => {
    if (!ticketDetails) return false;

    const expiryDate = new Date(ticketDetails.expiryDate);
    const now = new Date();

    return now < expiryDate && ticketDetails.isValid;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to manually invalidate ticket
  const invalidateTicket = () => {
    if (
      ticketDetails &&
      window.confirm("Are you sure you want to invalidate this ticket?")
    ) {
      setTicketDetails(null);
      alert("Ticket has been removed successfully.");
    }
  };

  // Update profile image
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should not exceed 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);

        // Update user object with new profile image
        if (user) {
          const updatedUser = { ...user, profileImage: reader.result };
          setUser(updatedUser);

          // Update in localStorage
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));

          // Update in users array
          const users = JSON.parse(localStorage.getItem("users") || "[]");
          const updatedUsers = users.map((u) =>
            u.id === user.id ? updatedUser : u
          );
          localStorage.setItem("users", JSON.stringify(updatedUsers));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "login":
        return (
          <div className="tab-content">
            <h2>Login to Your Account</h2>
            <form onSubmit={handleLogin} className="auth-form">
              {authError && <div className="auth-error">{authError}</div>}
              <div className="form-group">
                <label htmlFor="loginEmail">Email</label>
                <input
                  type="email"
                  id="loginEmail"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="loginPassword">Password</label>
                <input
                  type="password"
                  id="loginPassword"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="auth-buttons">
                <button type="submit" className="auth-button">
                  Login
                </button>
                <p className="auth-switch">
                  Don't have an account?{" "}
                  <span onClick={() => setActiveTab("signup")}>Sign up</span>
                </p>
              </div>
            </form>
          </div>
        );

      case "signup":
        return (
          <div className="tab-content">
            <h2>Create a New Account</h2>
            <form onSubmit={handleSignup} className="auth-form">
              {authError && <div className="auth-error">{authError}</div>}

              <div className="profile-image-upload">
                <div
                  className="image-upload-preview"
                  onClick={triggerFileInput}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile Preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span className="material-icons">add_a_photo</span>
                      <p>Add Photo</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="signupName">Full Name</label>
                <input
                  type="text"
                  id="signupName"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signupEmail">Email</label>
                <input
                  type="email"
                  id="signupEmail"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signupPhone">Phone Number</label>
                <input
                  type="tel"
                  id="signupPhone"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signupPassword">Password</label>
                <input
                  type="password"
                  id="signupPassword"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signupConfirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="signupConfirmPassword"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              <div className="auth-buttons">
                <button type="submit" className="auth-button">
                  Sign Up
                </button>
                <p className="auth-switch">
                  Already have an account?{" "}
                  <span onClick={() => setActiveTab("login")}>Login</span>
                </p>
              </div>
            </form>
          </div>
        );

      case "buyTicket":
        return (
          <div className="tab-content">
            <h2>Buy a Transport Ticket</h2>
            <div className="ticket-form">
              <div className="form-group">
                <label>Ticket Amount</label>
                <select
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="select-input"
                >
                  <option value={200000}>
                    <span>Family - </span> ₦2000 (max - 4 people)
                  </option>
                  <option value={100000}>
                    <span>Individual - </span> ₦1000
                  </option>
                </select>
              </div>
              <div className="paystack-button-container">
                <button
                  onClick={initializePaystack}
                  className="paystack-button"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        );

      case "qrCode":
        return (
          <div className="tab-content">
            <h2>Your Ticket QR Code</h2>
            {ticketDetails ? (
              <div className="qr-container">
                {isTicketValid() ? (
                  <>
                    {/* Hidden printable ticket section */}
                    <div
                      id="printable-ticket"
                      ref={printRef}
                      style={{
                        display: "none",
                        width: "100%",
                        maxWidth: "800px",
                        margin: "0 auto",
                        padding: "20px",
                        backgroundColor: "#fff",
                        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{ textAlign: "center", marginBottom: "20px" }}
                      >
                        <h1 style={{ color: "#333", margin: "0 0 5px 0" }}>
                          Transport Ticket
                        </h1>
                        <p
                          style={{
                            color: "#666",
                            margin: "0",
                            fontSize: "14px",
                          }}
                        >
                          Valid from {formatDate(ticketDetails.purchaseDate)} to{" "}
                          {formatDate(ticketDetails.expiryDate)}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p style={{ margin: "5px 0", fontSize: "14px" }}>
                            <strong>Passenger:</strong> {user.name}
                          </p>
                          <p style={{ margin: "5px 0", fontSize: "14px" }}>
                            <strong>Email:</strong> {user.email}
                          </p>
                          <p style={{ margin: "5px 0", fontSize: "14px" }}>
                            <strong>Phone:</strong> {user.phone}
                          </p>
                          <p style={{ margin: "5px 0", fontSize: "14px" }}>
                            <strong>Ticket ID:</strong> {ticketDetails.id}
                          </p>
                          <p style={{ margin: "5px 0", fontSize: "14px" }}>
                            <strong>Amount Paid:</strong> ₦
                            {ticketDetails.amount}
                          </p>
                          <p style={{ margin: "5px 0", fontSize: "14px" }}>
                            <strong>Purchase Date:</strong>{" "}
                            {formatDate(ticketDetails.purchaseDate)}
                          </p>
                          <p style={{ margin: "5px 0", fontSize: "14px" }}>
                            <strong>Expiry Date:</strong>{" "}
                            {formatDate(ticketDetails.expiryDate)}
                          </p>
                        </div>
                        {qrCodeUrl && (
                          <div style={{ marginLeft: "20px" }}>
                            <img
                              src={qrCodeUrl}
                              alt="Ticket QR Code"
                              style={{ width: "150px", height: "150px" }}
                            />
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: "30px",
                          padding: "10px",
                          borderTop: "1px dashed #ccc",
                          textAlign: "center",
                          fontSize: "12px",
                          color: "#666",
                        }}
                      >
                        <p>
                          Please present this ticket when boarding. Valid for
                          one week from purchase date.
                        </p>
                        <p>© 2025 Transport Manager. All rights reserved.</p>
                      </div>
                    </div>

                    {/* Visible QR code display */}
                    <div
                      style={{
                        background: "white",
                        padding: "16px",
                        borderRadius: "8px",
                      }}
                    >
                      {qrCodeUrl && (
                        <img
                          src={qrCodeUrl}
                          alt="Ticket QR Code"
                          style={{ width: "200px", height: "200px" }}
                        />
                      )}
                    </div>
                    <div className="ticket-info">
                      <p>
                        <strong>Ticket ID:</strong> {ticketDetails.id}
                      </p>
                      <p>
                        <strong>Purchase Date:</strong>{" "}
                        {formatDate(ticketDetails.purchaseDate)}
                      </p>
                      <p>
                        <strong>Expiry Date:</strong>{" "}
                        {formatDate(ticketDetails.expiryDate)}
                      </p>
                      <p className="valid-badge">Valid</p>
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "20px",
                      }}
                    >
                      <button
                        onClick={handlePrint}
                        style={{
                          padding: "10px 16px",
                          backgroundColor: "#4CAF50",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span className="material-icons">print</span>
                        Print Ticket
                      </button>

                      <button
                        onClick={handleDownload}
                        style={{
                          padding: "10px 16px",
                          backgroundColor: "#2196F3",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span className="material-icons">download</span>
                        Download PDF
                      </button>

                      <button
                        onClick={invalidateTicket}
                        style={{
                          padding: "10px 16px",
                          backgroundColor: "#ff4d4d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span className="material-icons">delete</span>
                        Remove Ticket
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="expired-ticket">
                    <div className="qr-disabled">
                      <span className="material-icons">qr_code_2</span>
                      <div className="disabled-overlay"></div>
                    </div>
                    <p className="expired-text">
                      Your ticket has expired or is not valid
                    </p>
                    <button
                      className="buy-new-ticket"
                      onClick={() => setActiveTab("buyTicket")}
                    >
                      Buy a New Ticket
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-ticket">
                <p>You don't have an active ticket</p>
                <button
                  className="buy-new-ticket"
                  onClick={() => setActiveTab("buyTicket")}
                >
                  Buy a Ticket
                </button>
              </div>
            )}
          </div>
        );

      case "transactions":
        return (
          <div className="tab-content">
            <h2>Transaction History</h2>
            {transactions.length > 0 ? (
              <div className="transaction-list">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-card">
                    <div className="transaction-header">
                      <span className="transaction-type">
                        {transaction.type}
                      </span>
                      <span className="transaction-amount">
                        ₦{transaction.amount}
                      </span>
                    </div>
                    <div className="transaction-details">
                      <span className="transaction-date">
                        {formatDate(transaction.date)}
                      </span>
                      <span className="transaction-ref">
                        Ref: {transaction.reference}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-transactions">No transactions yet</p>
            )}
          </div>
        );

      case "profile":
        return (
          <div className="tab-content">
            <h2>User Profile</h2>
            <div className="profile-card">
              <div className="profile-image-container">
                <input
                  type="file"
                  id="profileImageInput"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="profileImageInput"
                  className="profile-image-label"
                >
                  {profileImage ? (
                    <div className="profile-image-wrapper">
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="profile-image"
                      />
                      <div className="edit-overlay">
                        <span className="material-icons">edit</span>
                      </div>
                    </div>
                  ) : (
                    <div className="profile-avatar">
                      <span>{user?.name?.charAt(0) || "U"}</span>
                      <div className="edit-overlay">
                        <span className="material-icons">edit</span>
                      </div>
                    </div>
                  )}
                </label>
              </div>
              <div className="profile-details">
                <h3>{user?.name}</h3>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Phone:</strong> {user?.phone}
                </p>
                <p>
                  <strong>User ID:</strong> {user?.id}
                </p>

                <div className="profile-actions">
                  <button onClick={resetApp} className="reset-button">
                    <span className="material-icons">refresh</span>
                    Reset App Data
                  </button>

                  <button onClick={handleLogout} className="logout-button">
                    <span className="material-icons">logout</span>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render distress button UI component
  const renderDistressButton = () => {
    if (!user) return null;

    return (
      <div className="distress-button-container">
        {distressMode ? (
          <button
            className="distress-button active"
            onClick={deactivateDistress}
          >
            <span className="material-icons">emergency</span>
            <span>CANCEL EMERGENCY</span>
          </button>
        ) : (
          <button className="distress-button" onClick={activateDistress}>
            <span className="material-icons">emergency</span>
            <span>EMERGENCY</span>
          </button>
        )}
      </div>
    );
  };

  // Emergency contacts section for profile tab
  const renderEmergencyContactsSection = () => {
    return (
      <div className="emergency-contacts-section">
        <h3>Emergency Contacts</h3>
        <p>These contacts will be notified in case of emergency</p>

        <form onSubmit={addEmergencyContact} className="emergency-contact-form">
          <div className="form-group">
            <label htmlFor="emergencyContactName">Contact Name</label>
            <input
              type="text"
              id="emergencyContactName"
              placeholder="Enter contact name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="emergencyContactPhone">Contact Phone</label>
            <input
              type="tel"
              id="emergencyContactPhone"
              placeholder="Enter contact phone number"
            />
          </div>
          <button type="submit" className="add-contact-button">
            <span className="material-icons">add</span>
            Add Contact
          </button>
        </form>

        <div className="emergency-contacts-list">
          {emergencyContacts.length > 0 ? (
            emergencyContacts.map((contact) => (
              <div key={contact.id} className="emergency-contact-card">
                <div className="contact-info">
                  <span className="contact-name">{contact.name}</span>
                  <span className="contact-phone">{contact.phone}</span>
                </div>
                <button
                  className="remove-contact-button"
                  onClick={() => removeEmergencyContact(contact.id)}
                >
                  <span className="material-icons">delete</span>
                </button>
              </div>
            ))
          ) : (
            <p className="no-contacts">No emergency contacts added yet</p>
          )}
        </div>
      </div>
    );
  };

  // Determine which footer to show based on authentication status
  const renderFooter = () => {
    if (!user) {
      return (
        <footer className="app-footer">
          <div
            className={`tab-item ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            <span className="material-icons">login</span>
            <span>Login</span>
          </div>
          <div
            className={`tab-item ${activeTab === "signup" ? "active" : ""}`}
            onClick={() => setActiveTab("signup")}
          >
            <span className="material-icons">person_add</span>
            <span>Sign Up</span>
          </div>
        </footer>
      );
    } else {
      return (
        <footer className="app-footer">
          <div
            className={`tab-item ${activeTab === "buyTicket" ? "active" : ""}`}
            onClick={() => setActiveTab("buyTicket")}
          >
            <span className="material-icons">receipt</span>
            <span>Buy Ticket</span>
          </div>
          <div
            className={`tab-item ${activeTab === "qrCode" ? "active" : ""}`}
            onClick={() => setActiveTab("qrCode")}
          >
            <span className="material-icons">qr_code_2</span>
            <span>QR Ticket</span>
          </div>
          <div
            className={`tab-item ${
              activeTab === "transactions" ? "active" : ""
            }`}
            onClick={() => setActiveTab("transactions")}
          >
            <span className="material-icons">history</span>
            <span>History</span>
          </div>
          <div
            className={`tab-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="material-icons">person</span>
            <span>Profile</span>
          </div>
        </footer>
      );
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TransEdo</h1>
      </header>

      <main className="main-content">{renderTabContent()}</main>

      {/* Add the distress button here */}
      {renderDistressButton()}

      {renderFooter()}
    </div>
  );
}
