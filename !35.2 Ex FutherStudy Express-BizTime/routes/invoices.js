const db = require("../db");
const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");

router.get('/', async (req, res, next) => {
   try {
      const result = await db.query(`
      SELECT id, comp_code
      FROM invoices
      ORDER BY id`);
    let invs = result.rows;
    return res.json( {'invoices': invs} );
   }

   catch (e) {
     return next(e);
   }
 });
 
 router.get('/:id', async (req, res, next) => {
    try {
       const id = req.params.id;
       const result = await db.query(`
       SELECT invoices.id,
              invoices.amt, 
              invoices.paid, 
              invoices.add_date, 
              invoices.paid_date, 
              companies.code, 
              ompanies.name, 
              companies.description 
       FROM invoices 
       INNER JOIN companies 
       ON invoices.comp_code = companies.code
       WHERE invoices.id=$1`, [id]);
       if(result.rows.length === 0) {
          throw new ExpressError(`There is no invoice with the id: ${ id }`, 404)
       }
       const data = result.rows[0];
       const invs = {
      id: data.id,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
    };
       return res.json({'invoices': invs})
    } catch(e) {
       return next(e);
    }
 })
 
 router.post('/', async (req, res, next) => {
    try {
       const { comp_code, amt } = req.body;
       const results = await db.query(`
       INSERT INTO invoices (comp_code, amt) 
       VALUES ($1, $2) 
       RETURNING id, comp_code, amt, paid, add_date, paid_date
       `, [comp_code, amt]);
       return res.json({'invoices': results.rows[0]});
    } catch(e) {
       return next(e);
    }
 })
 
 router.put('/:id', async (req, res, next) => {
    try {
       const { amt, paid } = req.body;
       const id = req.params.id;
       const addPaidDate = null;

       const currResult = await db.query(
             `SELECT paid
              FROM invoices
              WHERE id = $1`,
           [id]);
   
       if (currResult.rows.length === 0) {
         throw new ExpressError(`No such invoice: ${id}`, 404);
       }
   
       const currPaidDate = currResult.rows[0].paid_date;
   
       if (!currPaidDate && paid) {
         addPaidDate = new Date();
       } else if (!paid) {
         addPaidDate = null
       } else {
         addPaidDate = currPaidDate;
       }

       const results = await db.query(`
       UPDATE invoices 
       SET amt = $1, paid = $2, paid_date=$3 
       WHERE id = $3 
       RETURNING id, comp_code, amt, paid, add_date, paid_date
       `, [amt, paid, addPaidDate, id]);
       if(results.rows.length === 0) {
          throw new ExpressError(`There is no invoice with the id: ${ id }`, 404)
       }
       return res.json({'invoices': results.rows[0]})
    } catch(e) {
       return next(e);
    }
 })
 
 router.delete('/:id', async (req, res, next) => {
    try {
       const id = req.params.id;
       const results = await db.query(`
       DELETE FROM invoices
       WHERE id = $1
       RETURNING id`, [id]);
       return res.json({ message: "Deleted" });
    } catch(e) {
       return next(e);
    }
 })
 

module.exports = router;