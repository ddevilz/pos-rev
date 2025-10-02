import './print.css';
import React from "react";
import type { Order, OrderItem } from "@/types";

// Local extension to gracefully read backend-joined customer fields
interface OrderForReceipt extends Order {
  customer_name?: string;
  customer_mobile?: string;
  customer_address1?: string;
  customer_address2?: string;
  customer_city?: string;
  customer_state?: string;
  customer_pincode?: string;
}

interface Props {
  order: OrderForReceipt;
}

const formatAmount = (n?: number) => (typeof n === "number" ? n.toFixed(2) : "0.00");

const OrderReceipt: React.FC<Props> = ({ order }) => {
  const createdAt = order.created_at ? new Date(order.created_at) : new Date();
  const customerName = order.customer_name || order.customer?.cname || "";
  const customerMobile = order.customer_mobile || order.customer?.mobile || "";
  const customerAddress =
    order.customer_address1 || order.customer?.add1 || "";

  const items: OrderItem[] = (order.items || []) as OrderItem[];

  return (
    <div className="receipt">
      {/* Header */}
      <div className="r-center r-bold r-title">BUSINESS NAME</div>
      <div className="r-center r-muted">Address line 1</div>
      <div className="r-center r-muted">Address line 2</div>
      <div className="r-center r-muted">Phone: _____________</div>
      <div className="r-divider" />

      {/* Order meta */}
      <div className="r-row">
        <div>Order:</div>
        <div className="r-bold">{order.order_number}</div>
      </div>
      <div className="r-row">
        <div>Date:</div>
        <div>
          {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
        </div>
      </div>
      {order.priority && (
        <div className="r-row">
          <div>Priority:</div>
          <div className="r-capitalize">{order.priority}</div>
        </div>
      )}

      <div className="r-divider" />

      {/* Customer */}
      {(customerName || customerMobile || customerAddress) && (
        <>
          <div className="r-subtitle">Customer</div>
          {customerName && <div>{customerName}</div>}
          {customerMobile && <div>{customerMobile}</div>}
          {customerAddress && <div>{customerAddress}</div>}
          <div className="r-divider" />
        </>
      )}

      {/* Items */}
      <div className="r-subtitle">Items</div>
      {items.length === 0 && <div>No items</div>}
      {items.map((it, idx) => {
        const quantity = Number(it.quantity) || 0;
        const rate = Number(it.rate) || 0;
        const amount = Number(it.amount) || 0;

        return (
          <div key={idx} className="r-item">
            <div className="r-item-line1">
              <span className="r-name">{it.service_name}</span>
              <span className="r-amount">₹{formatAmount(amount)}</span>
            </div>
            <div className="r-item-line2">
              <span>
                Qty: {quantity} x ₹{formatAmount(rate)}
              </span>
              {it.notes && <span className="r-notes">{it.notes}</span>}
            </div>
          </div>
        );
      })}

      <div className="r-divider" />

      {/* Totals */}
      <div className="r-row">
        <div>Subtotal</div>
        <div>₹{formatAmount(Number(order.subtotal) || 0)}</div>
      </div>
      {order.discount_percentage > 0 && (
        <div className="r-row">
          <div>
            Discount ({order.discount_percentage}%)
          </div>
          <div>-₹{formatAmount(Number(order.discount_amount) || 0)}</div>
        </div>
      )}
      {order.tax_percentage > 0 && (
        <div className="r-row">
          <div>
            Tax ({order.tax_percentage}%)
          </div>
          <div>₹{formatAmount(Number(order.tax_amount) || 0)}</div>
        </div>
      )}
      <div className="r-row r-bold r-total">
        <div>Total</div>
        <div>₹{formatAmount(Number(order.total_amount) || 0)}</div>
      </div>
      {Number(order.advance_paid) > 0 && (
        <>
          <div className="r-row">
            <div>Advance Paid</div>
            <div>₹{formatAmount(Number(order.advance_paid) || 0)}</div>
          </div>
          <div className="r-row r-bold">
            <div>Remaining</div>
            <div>₹{formatAmount(Number(order.remaining_amount) || 0)}</div>
          </div>
        </>
      )}

      <div className="r-divider" />

      <div className="r-center r-muted">Thank you for your business!</div>
      <div className="r-center r-muted">GST details / Return policy (if any)</div>
    </div>
  );
};

export default OrderReceipt;
