/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Checkout } from '../models/Checkout';
import { ExistingOrder } from '../../clients/orders/model/existingOrder';
import { IOrdersService } from './IOrdersService';

export class HttpOrdersService implements IOrdersService {
  constructor(private readonly endpoint: string) {}

  async create(checkout: Checkout): Promise<ExistingOrder> {
    const { shippingAddress, items } = checkout;

    const body = {
      shippingAddress: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        email: shippingAddress.email,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2 ?? null,
        city: shippingAddress.city,
        zipCode: shippingAddress.zip,
        state: shippingAddress.state,
      },
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitCost: item.price,
        totalCost: item.totalCost,
      })),
    };

    const response = await fetch(`${this.endpoint}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Orders service returned ${response.status}`);
    }

    return response.json() as Promise<ExistingOrder>;
  }
}
