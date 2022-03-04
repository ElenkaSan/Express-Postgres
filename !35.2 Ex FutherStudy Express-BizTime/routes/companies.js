const db = require("../db");
const express = require("express");
const router = new express.Router();
const slugify = require("slugify");
const ExpressError = require("../expressError");

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
    SELECT code, name 
    FROM companies 
    ORDER BY name`
);
    let comps = result.rows;
    return res.json({ 'companies': comps })
  } catch (e) {
    return next(e)
  }
})

router.get('/:code', async (req, res, next) => {
    try {
       const { code } = req.params;
       const result = await db.query(`
       SELECT code, name, description 
       FROM companies 
       WHERE code = $1
       `, [code] );
       const invoicesResult = await db.query(
         `SELECT id
          FROM invoices
          WHERE comp_code = $1
          `, [code] );
       if(result.rows.length === 0) {
          throw new ExpressError(`A company with the code: ${ code } can't be find`, 404)
       }
       let comp = result.rows[0];
       let invoices = invoicesResult.rows;
       comp.invoices = invoices.map(inv => inv.id);
       return res.json({'company': comp })
    } catch(e) {
       return next(e);
    }
 })
 

router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const code = slugify(name, {lower: true});
        const result = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ($1, $2, $3) 
        RETURNING code, name, description
        `, [code, name, description]);
        return res.status(201).json({'company': result.rows[code]});
     } catch(e) {
        return next(e)
     }
  })

router.put('/:code', async (req, res, next) => {
    try {
       const code = req.params.code;
       const { name, description } = req.body;
       const result = await db.query(`
       UPDATE companies SET name = $1, description = $2 
       WHERE code = $3 RETURNING code, name, description
       `, [name, description]);
       if(result.rows.length === 0) {
          throw new ExpressError(`A company with the code: ${ code } can't be find`, 404)
       }
       return res.json({company: result.rows[0] });
    } catch(e) {
       return next(e);
    }
 })

router.delete('/:code', async function(req, res, next) {
    try {
        const code = req.params.code;
        const results = await db.query(`
        DELETE FROM companies 
        WHERE code=$1
        RETURNING code
        `, [code]);
        if(results.rows.length === 0) {
           throw new ExpressError(`There is no company with the code: ${ code }`, 404)
        }
      return res.json({ message: "Deleted" });
    } catch (err) {
      return next(err);
    }
  });


  module.exports = router;