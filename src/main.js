/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
     const { sale_price, quantity } = purchase;
   
   const discount =    1 - (purchase.discount / 100)
   return sale_price * quantity * discount;
  
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number} 
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0){
        return seller.profit * 0.15;
    }
    else if (index === 1 || index === 2){
        return seller.profit * 0.10;
    }
    else if (index === total - 1){
        return 0;
    }
    else {
        return seller.profit * 0.05;
    }

   
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;
    // @TODO: Проверка входных данных
    function inputDataChecking(data) {
        if (!data 
            || !Array.isArray(data.sellers) 
            || !Array.isArray(data.products) 
            || !Array.isArray(data.purchase_records)
            || data.sellers.length === 0
            || data.products.length === 0
            || data.purchase_records.length === 0
        ) {
            throw new Error('Нет входных данных');
        }
    }
     inputDataChecking(data)

    // @TODO: Проверка наличия опций
    function optionChecking(options){
    if (!options
        || typeof options !== "object"
    ) {
        throw new Error ("Нет опции");
    }

    if (!calculateBonus || !calculateRevenue ) {
        throw new Error("Чего то не хватает");
    }

    if ( typeof calculateRevenue !== "function"
        || typeof calculateBonus !== "function"
    ){
        throw new Error("Переменные не являются функциями")
    }
     
    }
    optionChecking(options)
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map((seller)=> {
        return{
                seller_id: seller.id,
                name: `${seller.first_name} ${seller.last_name}`,
                revenue: 0,
                profit: 0,
                sales_count: 0,
                products_sold: {}
        }
    })

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.seller_id, seller])) // Ключом будет id, значением — запись из sellerStats
   
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku,product])) // Ключом будет sku, значением — запись из data.products
    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach( record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count = (seller.sales_count || 0)+ 1;
        seller.revenue =(seller.revenue || 0) + record.total_amount;

           record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const itemRevenue = calculateRevenue(item,product)
            const profit = itemRevenue - cost;
            seller.profit += profit;
            if (!seller.products_sold[item.sku]){
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;

        })
            
          
        


        
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a,b) => b.profit - a.profit)

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller,index) =>{
        seller.bonus = calculateBonus(index, sellerStats.length,seller)

        seller.top_products = Object.entries(seller.products_sold).map(([sku,quantity])=> ({
            sku,
            quantity
        }))
        .sort((a,b)=> b.quantity - a.quantity)
        .slice(0, 10)
    })
    // @TODO: Подготовка итоговой коллекции с нужными полями    
    return sellerStats.map(seller => ({
        seller_id: seller.seller_id ,// Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
        profit: + seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2) // Число с двумя знаками после точки, бонус продавца
}));

}
