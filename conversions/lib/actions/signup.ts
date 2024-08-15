"use server";

import { z } from "zod";
import { actionClient } from "./safe-action";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { getStripe } from "../stripe";
import { redirect } from "next/navigation";
import { getConfig } from "../config";
import { getDub } from "../dub";
import { setSession } from "../session";

const signupSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

// Fake signup logic and store user in cookies
export const signUpUser = actionClient
  .schema(signupSchema)
  .action(async ({ parsedInput }) => {
    const clickId = cookies().get("dclid")?.value;

    if (!clickId) {
      // fake a 250ms delay
      await new Promise((resolve) => setTimeout(resolve, 250));
      throw new Error("No clickId found in cookies. Skipping signup.");
    }

    const randomId = nanoid();

    const user = {
      ...parsedInput,
      id: randomId,
      image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${randomId}`,
    };

    setSession(user);

    const dub = getDub();
    await dub.track.lead({
      clickId,
      eventName: "Sign Up",
      customerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      customerAvatar: user.image,
    });

    cookies().delete("dclid");

    const stripe = getStripe();
    const config = getConfig();

    // Create a customer
    const customer = await stripe.customers.create({
      name: user.name,
      email: user.email,
      address: {
        line1: "510 Townsend St",
        postal_code: "98140",
        city: "San Francisco",
        state: "CA",
        country: "US",
      },
      metadata: {
        dubCustomerId: user.id,
      },
    });

    // Create a subscription
    const { url } = await stripe.checkout.sessions.create({
      customer: customer.id,
      success_url: "http://localhost:3000?session_id={CHECKOUT_SESSION_ID}",
      line_items: [
        {
          price: config.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: {
        dubCustomerId: user.id,
      },
    });

    if (url) {
      redirect(url);
    }

    return { ok: true, user, checkoutUrl: url };
  });
