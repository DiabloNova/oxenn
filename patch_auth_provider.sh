#!/bin/bash
sed -i 's/login: (email: string, password?: string) => Promise<void>;/login: (email: string, password: string) => Promise<void>;/g' src/components/AuthProvider.tsx
sed -i 's/register: (name: string, email: string, password?: string) => Promise<void>;/register: (name: string, email: string, password: string) => Promise<void>;/g' src/components/AuthProvider.tsx
sed -i 's/const login = async (email: string, password?: string) => {/const login = async (email: string, password: string) => {/g' src/components/AuthProvider.tsx
sed -i 's/const register = async (name: string, email: string, password?: string) => {/const register = async (name: string, email: string, password: string) => {/g' src/components/AuthProvider.tsx
sed -i 's/const user = await loginAction(email);/const user = await loginAction(email, password);/g' src/components/AuthProvider.tsx
sed -i 's/const user = await registerAction(name, email);/const user = await registerAction(name, email, password);/g' src/components/AuthProvider.tsx
