import { useState } from "react";

import { collection, getDocs } from "firebase/firestore";

import { Link } from "react-router-dom";

import { db } from "../firebase/config";

import { useAuth } from "../hooks/useAuth";

import { normalizeProperty } from "../utils/propertyHelpers";

import {

  buildChatRecommendationText,

  rankProperties,

} from "../utils/recommendations";



const FAQ = [

  {

    id: "min",

    q: "What is the minimum investment?",

    a: "Verified properties start at the share price — usually from Rs.5,000.",

  },

  {

    id: "otp",

    q: "What is the sandbox OTP?",

    a: "Use OTP 123456 for demo payments when Razorpay mode is off.",

  },

  {

    id: "feed",

    q: "Market Feed vs Verified?",

    a: "Market Feed contains raw demo listings. An admin publishes them to Verified before you can invest.",

  },

  {

    id: "onboard",

    q: "What is onboarding?",

    a: "After registering, complete setup: details, KYC demo, bank, risk, and goals. Then investing unlocks.",

  },

];



function ChatBot() {

  const { currentUser, userProfile, isOnboardingComplete } = useAuth();

  const [open, setOpen] = useState(false);

  const [loadingRecs, setLoadingRecs] = useState(false);

  const [dynamicAnswer, setDynamicAnswer] = useState("");



  const handleProfileRecommendations = async () => {

    if (!currentUser) {

      setDynamicAnswer("Please log in first to get profile-based recommendations.");

      return;

    }



    if (!isOnboardingComplete) {

      setDynamicAnswer("Complete onboarding first (/onboarding), then we can suggest properties for you.");

      return;

    }



    setLoadingRecs(true);

    setDynamicAnswer("");



    try {

      const snapshot = await getDocs(collection(db, "properties"));

      const properties = snapshot.docs.map((doc) =>

        normalizeProperty({ id: doc.id, ...doc.data() })

      );

      const ranked = rankProperties(properties, userProfile, 3);

      setDynamicAnswer(buildChatRecommendationText(ranked, userProfile));

    } catch (error) {

      console.error(error);

      setDynamicAnswer("Could not load recommendations. Please try again later.");

    } finally {

      setLoadingRecs(false);

    }

  };



  return (

    <div className="fixed bottom-6 right-6 z-40">

      {open && (

        <div className="mb-3 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-2xl">

          <div className="mb-3 flex items-center justify-between">

            <h3 className="font-semibold text-blue-400">BrickVest Help</h3>

            <button

              type="button"

              onClick={() => setOpen(false)}

              className="text-gray-400 hover:text-white"

              aria-label="Close help"

            >

              X

            </button>

          </div>



          <div className="mb-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-2 text-xs text-yellow-100">

            Demo AI — rule-based, not financial advice.

          </div>



          <button

            type="button"

            onClick={handleProfileRecommendations}

            disabled={loadingRecs}

            className="mb-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"

          >

            {loadingRecs ? "Matching..." : "Based on my profile?"}

          </button>



          {dynamicAnswer && (

            <div className="mb-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-100">

              {dynamicAnswer}

              {isOnboardingComplete && (

                <Link to="/recommendations" className="mt-2 block text-blue-300 underline">

                  Full recommendations page

                </Link>

              )}

            </div>

          )}



          <div className="max-h-52 space-y-3 overflow-y-auto text-sm">

            {FAQ.map((item) => (

              <div key={item.id} className="rounded-lg bg-gray-950 p-3">

                <p className="font-medium text-white">{item.q}</p>

                <p className="mt-1 text-gray-400">{item.a}</p>

              </div>

            ))}

          </div>

        </div>

      )}



      <button

        type="button"

        onClick={() => setOpen((current) => !current)}

        className="rounded-full bg-blue-600 px-5 py-3 font-semibold shadow-lg hover:bg-blue-700"

      >

        {open ? "Close" : "Help"}

      </button>

    </div>

  );

}



export default ChatBot;

