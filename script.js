/**********************************************
 * LocalStorage 读写工具函数
 **********************************************/
function getData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}
function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**********************************************
 * 读取或初始化分类、商品数据
 **********************************************/
let categories = [];
let products = [];
function loadProductData() {
  fetch("data/productData.json")
    .then(response => response.json())
    .then(data => {
      // 将从文件中加载的产品数据保存到 localStorage 或直接赋值给全局变量
      if (data.categories) {
        categories = data.categories;
        setData("categories", categories);
      }
      if (data.products) {
        products = data.products;
        setData("products", products);
      }
      // 重新渲染分类和产品
      renderCategoryBar();
      renderAllProducts();
    })
    .catch(err => console.error("加载产品数据失败：", err));
}

document.addEventListener("DOMContentLoaded", loadProductData);


/**********************************************
 * 前台逻辑（index.html）
 **********************************************/
let activeCategoryId = categories[0]?.id || 1;
let currentSearchKeyword = "";
let purchaseQuantity = 1;

const categoryListEl = document.getElementById("categoryList");
const productContainerEl = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");

if (categoryListEl && productContainerEl && searchInput) {
  function renderCategoryBar() {
    categoryListEl.innerHTML = "";
    categories.forEach(cat => {
      const li = document.createElement("li");
      li.className = "category-item";
      if (cat.id === activeCategoryId) li.classList.add("active");
      const link = document.createElement("a");
      link.href = `#cat-${cat.id}`;
      link.textContent = cat.name;
      li.addEventListener("click", () => {
        activeCategoryId = cat.id;
        renderCategoryBar();
      });
      li.appendChild(link);
      categoryListEl.appendChild(li);
    });
  }
  
  function renderAllProducts() {
    productContainerEl.innerHTML = "";
    categories.forEach(cat => {
      const catTitle = document.createElement("h2");
      catTitle.className = "category-title";
      catTitle.id = `cat-${cat.id}`;
      catTitle.textContent = cat.name;
      productContainerEl.appendChild(catTitle);
  
      const catProducts = products.filter(p =>
        p.categoryId === cat.id &&
        p.name.toLowerCase().includes(currentSearchKeyword.toLowerCase())
      );
  
      catProducts.forEach(prod => {
        const card = document.createElement("div");
        card.className = "product-card";
  
        const img = document.createElement("img");
        img.className = "product-image";
        img.src = prod.image;
        img.alt = prod.name;
  
        const info = document.createElement("div");
        info.className = "product-info";
  
        const nameEl = document.createElement("div");
        nameEl.className = "product-name";
        nameEl.textContent = prod.name;
  
        const tagsEl = document.createElement("div");
        tagsEl.className = "product-tags";
        if (prod.tags) {
          prod.tags.forEach(t => {
            const span = document.createElement("span");
            span.textContent = t;
            tagsEl.appendChild(span);
          });
        }
  
        const descEl = document.createElement("div");
        descEl.className = "product-desc";
        descEl.textContent = prod.desc || "";
  
        const priceEl = document.createElement("div");
        priceEl.className = "product-price";
        priceEl.textContent = `￥${(typeof prod.price === 'number' ? prod.price : 0).toFixed(2)}`;
  
        // 添加“选规格”按钮
        const specBtn = document.createElement("button");
        specBtn.className = "spec-btn";
        specBtn.textContent = "选规格";
        specBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openProductModal(prod);
        });
  
        info.appendChild(nameEl);
        info.appendChild(tagsEl);
        info.appendChild(descEl);
        info.appendChild(priceEl);
        info.appendChild(specBtn);
  
        card.appendChild(img);
        card.appendChild(info);
  
        productContainerEl.appendChild(card);
      });
    });
  }  
  
  searchInput.addEventListener("input", (e) => {
    currentSearchKeyword = e.target.value.trim();
    renderAllProducts();
  });
  
  /**********************************************
   * 弹窗相关（前台）
   **********************************************/
  const productModal = document.getElementById("productModal");
  const modalImage = document.getElementById("detailImage");
  const modalProductName = document.getElementById("detailName");
  const modalTags = document.getElementById("detailTags");
  const cupSizeOptions = document.getElementById("cupSizeOptions");
  const tempOptions = document.getElementById("tempOptions");
  const sugarOptions = document.getElementById("sugarOptions");
  const toppingOptions = document.getElementById("toppingOptions");
  const modalTotalPrice = document.getElementById("detailPrice");
  const buyNowBtn = document.getElementById("buyNowBtn");
  const addToCartBtn = document.getElementById("addToCartBtn");
  const purchaseQuantityEl = document.getElementById("purchaseQuantity");
  
  let currentProduct = null;
  let selectedCupIndex = 0;
  let selectedTempIndex = 0;
  let selectedSugarIndex = 0;
  let toppingQuantities = [];

  // 更新已选配料的显示
  function updateSelectedToppings() {
    const selectedToppings = currentProduct.options.toppings
      .filter((topping, idx) => toppingQuantities[idx] > 0) // 过滤掉数量为0的配料
      .map(topping => `${topping.label} x ${toppingQuantities[currentProduct.options.toppings.indexOf(topping)]}`)
      .join(", "); // 使用逗号连接配料内容
    
    const selectedInfoElement = document.querySelector(".selected-info p");
    
    if (selectedToppings) {
      selectedInfoElement.textContent = `已选：${selectedToppings}`; // 显示选中的配料
    } else {
      selectedInfoElement.textContent = "已选：无"; // 如果没有选配料，显示“无”
    }
  }
  
  function openProductModal(prod) {
    console.log("openProductModal triggered", prod);
    currentProduct = prod;
    selectedCupIndex = 0;
    selectedTempIndex = 0;
    selectedSugarIndex = 0;
    toppingQuantities = prod.options.toppings ? prod.options.toppings.map(() => 0) : [];
    purchaseQuantity = 1;
    purchaseQuantityEl.textContent = purchaseQuantity;
  
    modalImage.src = prod.image;
    modalProductName.textContent = prod.name;
    modalTags.innerHTML = "";
    if (prod.tags) {
      prod.tags.forEach(t => {
        const span = document.createElement("span");
        span.textContent = t;
        span.className = "tag";
        modalTags.appendChild(span);
      });
    }

    // 添加描述（desc）内容
    const detailDesc = document.getElementById("detailDesc");
    detailDesc.textContent = prod.desc;  // 如果没有描述则显示默认文本

    // 添加分割线
    const divider = document.createElement("div");
    divider.className = "divider";
    modalTags.appendChild(divider);

    // 杯型选项
    cupSizeOptions.innerHTML = "";
    if (prod.options.cupSizes) {
      prod.options.cupSizes.forEach((cs, idx) => {
        const div = document.createElement("div");
        div.className = "option";
        if (idx === 0) {
          div.classList.add("active");
          // 使用 innerHTML 插入推荐标签
          div.innerHTML = `<span class="option-label">☆推荐</span>${cs.label}${cs.price >= 0 ? `(+${cs.price})` : `(${cs.price})`}`;
        } else {
          div.textContent = `${cs.label}${cs.price >= 0 ? `(+${cs.price})` : `(${cs.price})`}`;
        }
        div.addEventListener("click", () => {
          selectedCupIndex = idx;
          Array.from(cupSizeOptions.children).forEach(c => {
            c.classList.remove("active");
            // 若是推荐项，则恢复 innerHTML（包含推荐标签）；
            if (c.classList.contains("recommended")) {
              const optionData = c.textContent.replace("☆推荐", "");
              c.innerHTML = `<span class="option-label">☆推荐</span>${optionData}`;
            }
          });
          // 设置当前选中项
          if (idx === 0) {
            div.classList.add("active");
            div.innerHTML = `<span class="option-label">☆推荐</span>${cs.label}${cs.price >= 0 ? `(+${cs.price})` : `(${cs.price})`}`;
          } else {
            div.classList.add("active");
            div.textContent = `${cs.label}${cs.price >= 0 ? `(+${cs.price})` : `(${cs.price})`}`;
          }
          updateTotalPrice();
        });
        cupSizeOptions.appendChild(div);
      });
    }

    // 温度选项
    tempOptions.innerHTML = "";
    if (prod.options.temperature) {
      prod.options.temperature.forEach((t, idx) => {
        const div = document.createElement("div");
        div.className = "option";
        if (idx === 0) {
          div.classList.add("active");
          div.innerHTML = `<span class="option-label">☆推荐</span>${t.label}${t.price >= 0 ? `(+${t.price})` : `(${t.price})`}`;
        } else {
          div.textContent = `${t.label}${t.price >= 0 ? `(+${t.price})` : `(${t.price})`}`;
        }
        div.addEventListener("click", () => {
          selectedTempIndex = idx;
          Array.from(tempOptions.children).forEach(c => c.classList.remove("active"));
          if (idx === 0) {
            div.classList.add("active");
            div.innerHTML = `<span class="option-label">☆推荐</span>${t.label}${t.price >= 0 ? `(+${t.price})` : `(${t.price})`}`;
          } else {
            div.classList.add("active");
            div.textContent = `${t.label}${t.price >= 0 ? `(+${t.price})` : `(${t.price})`}`;
          }
          updateTotalPrice();
        });
        tempOptions.appendChild(div);
      });
    }

    // 甜度选项
    sugarOptions.innerHTML = "";
    if (prod.options.sugar) {
      prod.options.sugar.forEach((s, idx) => {
        const div = document.createElement("div");
        div.className = "option";
        if (idx === 0) {
          div.classList.add("active");
          div.innerHTML = `<span class="option-label">☆推荐</span>${s.label}${s.price >= 0 ? `(+${s.price})` : `(${s.price})`}`;
        } else {
          div.textContent = `${s.label}${s.price >= 0 ? `(+${s.price})` : `(${s.price})`}`;
        }
        div.addEventListener("click", () => {
          selectedSugarIndex = idx;
          Array.from(sugarOptions.children).forEach(c => c.classList.remove("active"));
          if (idx === 0) {
            div.classList.add("active");
            div.innerHTML = `<span class="option-label">☆推荐</span>${s.label}${s.price >= 0 ? `(+${s.price})` : `(${s.price})`}`;
          } else {
            div.classList.add("active");
            div.textContent = `${s.label}${s.price >= 0 ? `(+${s.price})` : `(${s.price})`}`;
          }
          updateTotalPrice();
        });
        sugarOptions.appendChild(div);
      });
    }

    // 配料选项
    toppingOptions.innerHTML = "";
    if (prod.options.toppings) {
      prod.options.toppings.forEach((tp, idx) => {
        const row = document.createElement("div");
        row.className = "topping-row";
  
        const label = document.createElement("div");
        label.className = "topping-label";
        label.textContent = tp.label;
        row.appendChild(label);
  
        const priceSpan = document.createElement("div");
        priceSpan.className = "topping-price";
        priceSpan.textContent = `+${tp.price}`;
        row.appendChild(priceSpan);
  
        const minusBtn = document.createElement("button");
        minusBtn.className = "topping-btn";
        minusBtn.textContent = "-";
        minusBtn.addEventListener("click", () => {
          if (toppingQuantities[idx] > 0) {
            toppingQuantities[idx]--;
            qtySpan.textContent = toppingQuantities[idx];
            updateTotalPrice();
            // 根据数量更新 active 类
            if (toppingQuantities[idx] > 0) {
              row.classList.add("active");
              qtyTag.textContent = toppingQuantities[idx];
              qtyTag.style.display = 'inline-block';
              updateSelectedToppings();
            } else {
              row.classList.remove("active");
              qtyTag.textContent = "";
              qtyTag.style.display = 'none';
              updateSelectedToppings();
            }
          }
        });
        row.appendChild(minusBtn);

        const qtyTag = document.createElement("span");
        qtyTag.className = "topping-qty-tag";  // 用于显示数量的标签
        row.appendChild(qtyTag);
  
        const qtySpan = document.createElement("span");
        qtySpan.className = "topping-qty";
        qtySpan.textContent = toppingQuantities[idx];
        row.appendChild(qtySpan);
  
        const plusBtn = document.createElement("button");
        plusBtn.className = "topping-btn";
        plusBtn.textContent = "+";
        plusBtn.addEventListener("click", () => {
          toppingQuantities[idx]++;
          qtySpan.textContent = toppingQuantities[idx];
          updateTotalPrice();
          // 根据数量更新 active 类
          if (toppingQuantities[idx] > 0) {
            row.classList.add("active");
            qtyTag.textContent = toppingQuantities[idx];
            qtyTag.style.display = 'inline-block';
            updateSelectedToppings();
          }
        });
        row.appendChild(plusBtn);

        // 如果配料的数量不为 0，默认添加 active 类，并显示数量标签
        if (toppingQuantities[idx] > 0) {
          row.classList.add("active");
          qtyTag.textContent = toppingQuantities[idx];
          qtyTag.style.display = 'inline-block';
        }else {
          qtyTag.textContent = ""; // 不显示数量标签
          qtyTag.style.display = 'none';
        }
  
        toppingOptions.appendChild(row);
      });
    }
  
    updateTotalPrice();
    updateSelectedToppings();
    document.getElementById("productModal").style.display = "flex";
  }
  
  function updateTotalPrice() {
    if (!currentProduct) return;
    let base = currentProduct.price;
    const cup = currentProduct.options.cupSizes ? currentProduct.options.cupSizes[selectedCupIndex].price : 0;
    const temp = currentProduct.options.temperature ? currentProduct.options.temperature[selectedTempIndex].price : 0;
    const sugar = currentProduct.options.sugar ? currentProduct.options.sugar[selectedSugarIndex].price : 0;
    let toppingsTotal = 0;
    if (currentProduct.options.toppings) {
      currentProduct.options.toppings.forEach((tp, idx) => {
        toppingsTotal += tp.price * toppingQuantities[idx];
      });
    }
    let singleTotal = base + cup + temp + sugar + toppingsTotal;
    let finalTotal = singleTotal * purchaseQuantity;
    modalTotalPrice.textContent = `￥${finalTotal.toFixed(2)}`;
    document.getElementById("detailPrice").textContent = `￥${finalTotal.toFixed(2)}`;
  }
  
  function closeModal() {
    document.getElementById("productModal").style.display = "none";
  }
  
  function increaseQuantity() {
    purchaseQuantity++;
    document.getElementById("purchaseQuantity").textContent = purchaseQuantity;
    updateTotalPrice();
  }
  function decreaseQuantity() {
    if (purchaseQuantity > 1) {
      purchaseQuantity--;
      document.getElementById("purchaseQuantity").textContent = purchaseQuantity;
      updateTotalPrice();
    }
  }
  
  function buyNow() {
    if (!currentProduct) return;
  
    // 同 addToCart()，将当前商品添加到订单
    const quantity = parseInt(document.getElementById("purchaseQuantity").textContent, 10) || 1;
    const selectedCupSize = currentProduct.options.cupSizes[selectedCupIndex];
    const selectedTemperature = currentProduct.options.temperature[selectedTempIndex];
    const selectedSugar = currentProduct.options.sugar[selectedSugarIndex];
  
    let toppingsTotal = 0;
    currentProduct.options.toppings.forEach((topping, idx) => {
      toppingsTotal += topping.price * toppingQuantities[idx];
    });
  
    const selectedProduct = {
      id: currentProduct.id,
      name: currentProduct.name,
      basePrice: currentProduct.price,
      quantity: quantity,
      cupSize: selectedCupSize ? selectedCupSize.label : "无",
      temperature: selectedTemperature ? selectedTemperature.label : "无",
      sugar: selectedSugar ? selectedSugar.label : "无",
      toppings: currentProduct.options.toppings.map((topping, idx) => {
          // 如果该配料的数量大于 0，则返回对象，否则返回 null
          if(toppingQuantities[idx] > 0) {
            return {
              label: topping.label,
              quantity: toppingQuantities[idx],
              price: topping.price
            };
          }
          return null;
      }).filter(t => t !== null), // 去除 null 项
      totalPrice: currentProduct.price + selectedCupSize.price + selectedTemperature.price + selectedSugar.price + toppingsTotal
    };
  
    let order = getOrderData() || [];
    const existingProductIndex = order.findIndex(item => item.id === selectedProduct.id);
    if (existingProductIndex >= 0) {
      order[existingProductIndex].quantity += selectedProduct.quantity;
    } else {
      order.push(selectedProduct);
    }
    setOrderData(order);
    updateCartDisplay();
  
    // 关闭当前选规格弹窗
    closeModal();
    // 直接跳转到结算浮窗
    openCheckoutModal();
  }
  
  // 获取当前订单数据
  function getOrderData() {
    const data = localStorage.getItem("order");
    return data ? JSON.parse(data) : [];
  }

  // 保存订单数据到 localStorage
  function setOrderData(value) {
    localStorage.setItem("order", JSON.stringify(value));
  }

  // 添加商品到订单
  function addToCart() {
    if (!currentProduct) return; // 如果没有选中的商品，则不执行

    // 获取当前选择的商品规格和数量
    const quantity = parseInt(document.getElementById("purchaseQuantity").textContent, 10) || 1;
    const selectedCupSize = currentProduct.options.cupSizes[selectedCupIndex];
    const selectedTemperature = currentProduct.options.temperature[selectedTempIndex];
    const selectedSugar = currentProduct.options.sugar[selectedSugarIndex];

    // 计算配料总价
    let toppingsTotal = 0;
    currentProduct.options.toppings.forEach((topping, idx) => {
      toppingsTotal += topping.price * toppingQuantities[idx];
    });

    // 获取当前选中商品的信息
    const selectedProduct = {
      id: currentProduct.id,
      name: currentProduct.name,
      basePrice: currentProduct.price, // 基础价格
      quantity: quantity,
      cupSize: selectedCupSize ? selectedCupSize.label : "无",
      temperature: selectedTemperature ? selectedTemperature.label : "无",
      sugar: selectedSugar ? selectedSugar.label : "无",
      toppings: currentProduct.options.toppings.map((topping, idx) => {
          // 如果该配料的数量大于 0，则返回对象，否则返回 null
          if(toppingQuantities[idx] > 0) {
            return {
              label: topping.label,
              quantity: toppingQuantities[idx],
              price: topping.price
            };
          }
          return null;
      }).filter(t => t !== null), // 去除 null 项
      // 计算商品最终价格（包括规格）
      totalPrice: currentProduct.price + selectedCupSize.price + selectedTemperature.price + selectedSugar.price + toppingsTotal
    };

    // 获取当前订单数据
    let order = getOrderData();
    const existingProductIndex = order.findIndex(item => item.id === selectedProduct.id);

    // 如果商品已存在订单中，增加数量
    if (existingProductIndex >= 0) {
      order[existingProductIndex].quantity += selectedProduct.quantity;
    } else {
      // 否则添加新商品到订单
      order.push(selectedProduct);
    }

    // 保存更新后的订单数据
    setOrderData(order);

    // 更新购物车显示（例如：更新购物车的商品数量和总价）
    updateCartDisplay();

    alert("商品已添加到订单！");
    closeModal();
  }


  // 更新购物车显示（更新购物车商品数量和总价）
  function updateCartDisplay() {
    const cartCountEl = document.getElementById('cartCount');
    const cartTotalEl = document.getElementById('cartTotal');
    
    const order = getOrderData();
    const totalItems = order.reduce((sum, item) => sum + item.quantity, 0); // 计算购物车中商品的总数量
    const totalPrice = order.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0); // 计算购物车中商品的总价格

    cartCountEl.textContent = totalItems; // 更新购物车商品数量
    cartTotalEl.textContent = `￥${totalPrice.toFixed(2)}`; // 更新购物车总价格
  }
  
  renderCategoryBar();
  renderAllProducts();
}

/**********************************************
 * 结算浮窗相关（index.html）
 **********************************************/
// 打开结算浮窗并显示订单详情

function openCheckoutModal() {
  const order = getOrderData();
  let orderDetailsHTML = '';

  if (order.length > 0) {
    order.forEach(item => {
      const finalPrice = item.totalPrice * item.quantity; // 计算每个商品的最终价格

      orderDetailsHTML += `
        <div class="order-item">
          <p>${item.name} - ￥${item.basePrice} x ${item.quantity}</p>
          <p>杯型: ${item.cupSize}</p>
          <p>温度: ${item.temperature}</p>
          <p>甜度: ${item.sugar}</p>
          
          <!-- 配料显示，只有配料数量大于0时才显示 -->
          <p>配料: ${item.toppings.filter(topping => topping.quantity > 0).map(topping => `${topping.label} x ${topping.quantity}`).join(", ")}</p>

          <!-- 商品数量加减 -->
          <div class="quantity-group">
            <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, ${item.quantity - 1})">-</button>
            <span class="quantity-num">${item.quantity}</span>
            <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, ${item.quantity + 1})">+</button>
          </div>

          <p><strong>总价: ￥${finalPrice.toFixed(2)}</strong></p>
        </div>
      `;
    });
  } else {
    orderDetailsHTML = `<p>您的购物车是空的</p>`;
  }

  document.getElementById('checkoutOrderDetails').innerHTML = orderDetailsHTML;
  document.getElementById('checkoutModal').classList.add('active');

  // 生成可选时间段（只在预约自取时需要）
  generateTimeSlots();
  // 默认取餐方式：立即自取
  selectPickupType('immediate');
}



// 更新商品数量
function updateProductQuantity(productId, newQuantity) {
  const order = getOrderData();
  const product = order.find(item => item.id === productId);

  if (product) {
    // 如果数量为0，移除该商品
    if (newQuantity === 0) {
      const productIndex = order.indexOf(product);
      if (productIndex > -1) {
        order.splice(productIndex, 1); // 从订单中移除该商品
        setOrderData(order); // 保存更新后的订单
      }
    } else {
      // 确保数量大于0
      if (newQuantity > 0) {
        product.quantity = newQuantity;
        setOrderData(order); // 保存到 localStorage
      }
    }

    openCheckoutModal(); // 更新结算浮窗显示
    updateCartDisplay(); // 更新购物车显示
  }
}

let pickupType = 'immediate'; // 默认“立即自取”
let selectedTimeCategory = 'noon'; // 默认中午
let selectedSlot = null; // 记录用户选中的时段

// 切换取餐方式
function selectPickupType(type) {
  pickupType = type;
  const immediateBtn = document.getElementById('immediateBtn');
  const reserveBtn = document.getElementById('reserveBtn');
  const timeSlotSection = document.getElementById('timeSlotSection');

  if (type === 'immediate') {
    immediateBtn.classList.add('active');
    reserveBtn.classList.remove('active');
    timeSlotSection.style.display = 'none'; // 隐藏时间选择
  } else {
    immediateBtn.classList.remove('active');
    reserveBtn.classList.add('active');
    timeSlotSection.style.display = 'block'; // 显示时间选择
    selectTimeCategory(selectedTimeCategory); // 生成时间按钮
  }
}

// 切换时间类别：中午、下午、晚上
function selectTimeCategory(category) {
  selectedTimeCategory = category;
  // 更新类别按钮状态
  const categoryButtons = document.querySelectorAll('.time-category-btn');
  categoryButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.trim() === getCategoryLabel(category)) {
      btn.classList.add('active');
    }
  });
  generateTimeSlots(category);
}

// 返回时间类别显示名称
function getCategoryLabel(category) {
  if (category === 'noon') return '中午';
  if (category === 'afternoon') return '下午';
  if (category === 'evening') return '晚上';
  return '';
}

// 根据类别生成时间按钮（15分钟间隔）
function generateTimeSlots(category) {
  const timeSlotContainer = document.getElementById('timeSlotContainer');
  timeSlotContainer.innerHTML = '';

  let startHour, endHour;
  // 这里根据需求设定不同类别的时间段
  if (category === 'noon') {
    startHour = 11; endHour = 14; // 例如：11:00-14:00
  } else if (category === 'afternoon') {
    startHour = 14; endHour = 18; // 例如：14:00-18:00
  } else if (category === 'evening') {
    startHour = 18; endHour = 22; // 例如：18:00-22:00
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const slotTime = new Date(today.getTime());
      slotTime.setHours(hour, minute, 0, 0);
      const slotLabel = formatTime(slotTime);
      const btn = document.createElement('button');
      btn.className = 'time-btn';
      btn.textContent = slotLabel;

      // 如果当前类别是今天且时间已过，禁用该按钮
      if (isSameDay(slotTime, now) && slotTime < now) {
        btn.classList.add('disabled');
        btn.disabled = true;
      }

      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        // 清除其他 active
        const allBtns = document.querySelectorAll('#timeSlotContainer .time-btn');
        allBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSlot = slotTime;
      });

      timeSlotContainer.appendChild(btn);
    }
  }
}

// 格式化时间（hh:mm）
function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

// 关闭结算浮窗
function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
}

// 结算操作
function confirmCheckout() {
  const order = getOrderData(); // 假设该函数返回当前订单对象数组
  if (!order || order.length === 0) {
    alert("您的购物车是空的");
    return;
  }
  const remark = document.getElementById('remarkInput').value.trim();
  const pickupType = window.pickupType || 'immediate'; // 立即自取或预约自取
  const selectedSlot = window.selectedSlot; // 如果预约自取，这里可能有用户选择的时间
  
  // 构造订单数据对象
  const orderData = {
    orderItems: order,
    remark: remark,
    pickupType: pickupType,
    pickupTime: selectedSlot ? formatTime(selectedSlot) : null,
    createdAt: new Date().toISOString()
  };

  // 发送订单数据到后端接口
  fetch("https://yourserver.com/api/checkout", { // 请替换为实际后端接口地址
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderData)
  })
  .then(response => response.json())
  .then(data => {
    if(data.code === 200){
      alert("订单已保存，订单编号：" + data.orderNumber);
      // 清空购物车、关闭结算弹窗等操作
      setOrderData([]);
      updateCartDisplay();
      closeCheckoutModal();
    } else {
      alert("订单保存失败：" + data.msg);
    }
  })
  .catch(err => {
    console.error("订单提交失败：", err);
    alert("订单提交失败！");
  });
}


// 读取 bannerImages.json 并生成幻灯片
function loadBannerImages() {
  fetch("data/bannerImages.json")
    .then(response => response.json())
    .then(data => {
      const bannerSwiper = document.querySelector('.banner-swiper');
      bannerSwiper.innerHTML = ""; // 清空原有内容
      data.images.forEach(imgPath => {
        const slide = document.createElement("div");
        slide.className = "banner-slide";
        
        const img = document.createElement("img");
        img.src = imgPath;
        img.alt = "Banner Image";
        
        slide.appendChild(img);
        bannerSwiper.appendChild(slide);
      });
    })
    .catch(err => console.error("加载 banner 图片失败：", err));
}

// 页面加载时调用
document.addEventListener("DOMContentLoaded", loadBannerImages);

//
const bannerSwiper = document.querySelector('.banner-swiper');
let isMouseDown = false;
let startX, scrollLeft;

// 鼠标按下时开始拖动
bannerSwiper.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    startX = e.pageX - bannerSwiper.offsetLeft; // 获取鼠标当前位置
    scrollLeft = bannerSwiper.scrollLeft; // 获取当前滚动位置
    bannerSwiper.style.cursor = 'grabbing'; // 改变光标为抓取状态
});

// 鼠标移动时拖动滚动
bannerSwiper.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return; // 如果没有按下鼠标，忽略
    const moveX = e.pageX - bannerSwiper.offsetLeft; // 当前鼠标位置
    const scroll = moveX - startX; // 计算鼠标的移动距离
    bannerSwiper.scrollLeft = scrollLeft - scroll; // 更新滚动位置
});

// 鼠标松开时停止拖动
bannerSwiper.addEventListener('mouseup', () => {
    isMouseDown = false;
    bannerSwiper.style.cursor = 'grab'; // 恢复光标为抓取状态
});

// 鼠标离开时停止拖动
bannerSwiper.addEventListener('mouseleave', () => {
    isMouseDown = false;
    bannerSwiper.style.cursor = 'grab'; // 恢复光标为抓取状态
});


/**********************************************
 * 额外新增：解析 token 并获取用户信息
 **********************************************/

// 1. 解析 URL 中的 token 参数
function parseTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  return token;
}

// 2. 使用 token 调用用户信息接口
function fetchUserInfo(token) {
  // 注意：此处 'Accesstoken' 为文档中约定的请求头名称
  fetch('https://sc.jxdata.com/affairs_app/api/v1/third-party/user-info', {
    method: 'GET',
    headers: {
      'Accesstoken': token  // 将 token 放在请求头中
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.code === 200) {
      // data.data 是 AES+Base64 加密后的字符串
      const decryptedData = decryptAES(data.data);
      // 解析 JSON
      const userInfo = JSON.parse(decryptedData);
      console.log('获取到的用户信息:', userInfo);
      // 根据需要显示或使用 userInfo
      displayUserInfo(userInfo);
    } else {
      console.error('获取用户信息失败:', data.msg);
    }
  })
  .catch(error => {
    console.error('请求用户信息接口失败:', error);
  });
}

// 3. 解密函数
function decryptAES(base64Encrypted) {
  // 这里的 secretKey 需向“江西机关事务”APP方获取
  const secretKey = '213442932480324211'; 
  // 需引入 crypto-js 库
  // npm:  npm install crypto-js
  // 并在HTML中<script src="crypto-js.js"></script>或其他方式引入

  // AES/ECB/PKCS5Padding 解密示例
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(base64Encrypted) },
    key,
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    }
  );
  return decrypted.toString(CryptoJS.enc.Utf8);
}

// 4. 在页面中展示用户信息（可自定义）
function displayUserInfo(user) {
  // 在页面添加一些元素以显示用户信息
  // 示例：<div id="userName"></div>
  const nameEl = document.getElementById('userName');
  const organEl = document.getElementById('userOrgan');
  if(nameEl) nameEl.textContent = user.name || '无';
  if(organEl) organEl.textContent = user.organ || '无单位';
  // ...其他信息同理
}


