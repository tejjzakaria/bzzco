import Seller from "../models/sellers.model.js";

const getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find({}).sort({ createdAt: -1 });
    // DataTables expects data in this format
    res.json({ data: sellers });
  } catch (error) {
    console.log("ERROR FETCHING SELLERS", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addSeller = async (req, res) => {
    try {
      const { full_name, email, phone_number, company, country, plan } = req.body;
  
      if (!full_name || !email || !phone_number || !country || !plan) {
        req.session.message = {
          type: "error",
          text: "One or more required fields are empty.",
        };
        return res.redirect("/view-sellers");
      }

      const existingSeller = await Seller.findOne({ email });
      if (existingSeller) {
        req.session.message = {
          type: "error",
          text: "Seller already exists.",
        };
        return res.redirect("/view-sellers");
      }

      const newSeller = new Seller({ full_name, email, phone_number, company, country, plan });
      await newSeller.save();

      req.session.message = {
        type: "success",
        text: "Seller added successfully!",
      };
      res.redirect("/view-sellers");
    } catch (error) {
      console.log("ERROR ADDING SELLER", error);
      req.session.message = {
        type: "error",
        text: "Internal server error.",
      };
      res.redirect("/view-sellers");
    }
  };
  

export { addSeller, getAllSellers };