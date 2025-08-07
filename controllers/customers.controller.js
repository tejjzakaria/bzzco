import Customer from "../models/customers.model.js";

const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    // DataTables expects data in this format
    res.json({ data: customers });
  } catch (error) {
    console.log("ERROR FETCHING CUSTOMERS", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addCustomer = async (req, res) => {
    try {
      const { full_name, email, phone_number, company, country, plan } = req.body;
  
      if (!full_name || !email || !phone_number || !country || !plan) {
        req.session.message = {
          type: "error",
          text: "One or more required fields are empty.",
        };
        return res.redirect("/view-customers");
      }
  
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
        req.session.message = {
          type: "error",
          text: "Customer already exists.",
        };
        return res.redirect("/view-customers");
      }
  
      const newCustomer = new Customer({ full_name, email, phone_number, company, country, plan });
      await newCustomer.save();
  
      req.session.message = {
        type: "success",
        text: "Customer added successfully!",
      };
      res.redirect("/view-customers");
    } catch (error) {
      console.log("ERROR ADDING CUSTOMER", error);
      req.session.message = {
        type: "error",
        text: "Internal server error.",
      };
      res.redirect("/view-customers");
    }
  };
  

export { addCustomer, getAllCustomers };