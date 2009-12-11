MyStore = {
  b: new Broadcaster
};

MyStore.b.defaultScope = MyStore;


MyStore.Product = Class.create(ElementBase, {

  getIdValue: function(){
    return this.element.readAttribute('id').replace(/.*(\d+)$/, '$1');
  },

  afterInitialize: function(){
    this.hijack();
  },
  
  addToCart: function(){
    var product = this,
        url = this.element.down('.links .add a').readAttribute('href');

    /*new Ajax.Request(url, {
      onSuccess: function(res){*/
        MyStore.b.fire('product added to cart', product);
    /*  }
    });*/
  },

  hijack: function(){
    var product = this,
        link = this.element.down('.links .add a');
    link && link.observe('click', function(e){
      e.stop();
      product.addToCart();
    });
  }

});


MyStore.Cart = Class.create(ElementBase, {

  getItemsValue: function(){ return this.items; },
  setItemsValue: function(items){ this.items = items; },
  getUpdatedValue: function(){ return this.element.hasClassName('updated'); },
  setUpdatedValue: function(b){ this.element[b ? 'addClassName' : 'removeClassName']('updated'); },

  afterInitialize: function(){
    this.set('items', this.findItems());
    this.listenForPurchases();
  },

  findItems: function(){
    var cart = this;
    return this.element.select('.items .item').map(function(el){
      return new MyStore.CartItem(cart, el);
    });
  },

  listenForPurchases: function(){
    var cart = this;
    MyStore.b.listen('product added to cart', function(p){
      var items = cart.element.down('.items');
      items.insert('<li class="item" data-product-id="'+p.get('id')+'">'+p.get('title')+'</li>');
      cart.items.push(new MyStore.CartItem(cart, items.select('.item').last()));
      cart.set('updated', true);
      cart.items.last().set('added', true);
      setTimeout(function(){ cart.set('updated', false); cart.items.last().set('added', false); }, 1000);
    });
  }

});


MyStore.CartItem = Class.create(ElementBase, {

  getProductIdValue: function(){ return this.element.readAttribute('data-product-id'); },
  getTitleElement: function(){ return this.element; },
  getAddedValue: function(){ return this.element.hasClassName('added'); },
  setAddedValue: function(b){ this.element[b ? 'addClassName' : 'removeClassName']('added'); },

  initialize: function($super, cart, element){
    this.cart = cart;
    $super(element);
  },

  afterInitialize: function(){
    this.bubble(this.cart, 'item');
    this.hijack();
  },

  hijack: function(){
    var item = this,
        id = this.get('product_id');
    this.element.observe('click', function(e){
      e.stop();

      /*new Ajax.Request('/cart/remove/'+id, {
        onSuccess: function(){*/
          MyStore.b.fire('cart item removed', item);
          item.remove();
      /*  }
      });*/
    });
  }

});


MyStore.b.listen('ready', function(){

  this.products = $$('.products .product').map(function(el){
    return new MyStore.Product(el);
  });

  this.cart = new this.Cart($$('#sidebar .cart')[0]);

});


MyStore.b.listen('product added to cart', function(product){
  console.log('Product "'+product.get('title')+'" was removed from cart.');
});
MyStore.b.listen('cart item removed', function(item){
  console.log('Product "'+item.get('title')+'" was added to the cart.');
});
