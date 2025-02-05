router.get('/routeproducts', async (req, res) => {
    try {
      if (req.query.search != 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {  
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('productName'), ' ', '')),
              {
                [Op.like]: %${searchTerm}%
              }
            ),sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('category.categoryName'), ' ', '')),
              {
                [Op.like]: %${searchTerm}%
              }
            ),sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('brand.brandName'), ' ', '')),
              {
                [Op.like]: %${searchTerm}%
              }
            )
          ],
          status: true,
          isRouteItem: true
        };
      }else{
        whereClause = {
          status: true,
          isRouteItem: true
        }
      }
      const products = await Product.findAll({
        where: whereClause,
        include: [
          {model: Category, as: 'category', attributes: ['categoryName']},
          {model: Brand, as: 'brand', attributes: ['brandName']}
        ]
      });
      res.send(products);
    } catch (error) {
      res.send(error.message);
    }
  });