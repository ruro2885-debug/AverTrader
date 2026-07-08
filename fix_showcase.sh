#!/bin/bash
sed -i 's/Platform Ecosystem Preview/{t("show.title")}/g' src/components/PlatformShowcase.tsx
sed -i 's/Explore our suite of predictive tools, institutional analytics, and secure portfolio management interfaces in an interactive live preview./{t("show.subtitle")}/g' src/components/PlatformShowcase.tsx
sed -i 's/Back to Home/{t("show.back")}/g' src/components/PlatformShowcase.tsx
sed -i 's/Ready to access the Aver ecosystem?/{t("show.ready.title")}/g' src/components/PlatformShowcase.tsx
sed -i 's/Create your secure credentials to enter the live platform. Experience persistent portfolio metrics, signal scanners, and institutional-grade analytics./{t("show.ready.subtitle")}/g' src/components/PlatformShowcase.tsx
sed -i 's/Create Account/{t("auth.register")}/g' src/components/PlatformShowcase.tsx
sed -i 's/Sign In/{t("auth.signin")}/g' src/components/PlatformShowcase.tsx
