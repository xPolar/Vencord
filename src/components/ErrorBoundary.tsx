/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import Logger from "../utils/logger";
import { LazyComponent } from "../utils/misc";
import { Margins, React } from "../webpack/common";
import { ErrorCard } from "./ErrorCard";

interface Props {
    fallback?: React.ComponentType<React.PropsWithChildren<{ error: any; message: string; stack: string; }>>;
    onError?(error: Error, errorInfo: React.ErrorInfo): void;
    message?: string;
}

const color = "#e78284";

const logger = new Logger("React ErrorBoundary", color);

const NO_ERROR = {};

// We might want to import this in a place where React isn't ready yet.
// Thus, wrap in a LazyComponent
const ErrorBoundary = LazyComponent(() => {
    return class ErrorBoundary extends React.PureComponent<React.PropsWithChildren<Props>> {
        state = {
            error: NO_ERROR as any,
            stack: "",
            message: ""
        };

        static getDerivedStateFromError(error: any) {
            let stack = error?.stack ?? "";
            let message = error?.message || String(error);

            if (error instanceof Error && stack) {
                const eolIdx = stack.indexOf("\n");
                if (eolIdx !== -1) {
                    message = stack.slice(0, eolIdx);
                    stack = stack.slice(eolIdx + 1).replace(/https:\/\/\S+\/assets\//g, "");
                }
            }

            return { error, stack, message };
        }

        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
            this.props.onError?.(error, errorInfo);
            logger.error("A component threw an Error\n", error);
            logger.error("Component Stack", errorInfo.componentStack);
        }

        render() {
            if (this.state.error === NO_ERROR) return this.props.children;

            if (this.props.fallback)
                return <this.props.fallback
                    children={this.props.children}
                    {...this.state}
                />;

            const msg = this.props.message || "An error occurred while rendering this Component. More info can be found below and in your console.";

            return (
                <ErrorCard style={{
                    overflow: "hidden",
                }}>
                    <h1>Oh no!</h1>
                    <p>{msg}</p>
                    <code>
                        {this.state.message}
                        {!!this.state.stack && (
                            <pre className={Margins.marginTop8}>
                                {this.state.stack}
                            </pre>
                        )}
                    </code>
                </ErrorCard>
            );
        }
    };
}) as
    React.ComponentType<React.PropsWithChildren<Props>> & {
        wrap<T extends JSX.IntrinsicAttributes = any>(Component: React.ComponentType<T>): React.ComponentType<T>;
    };

ErrorBoundary.wrap = Component => props => (
    <ErrorBoundary>
        <Component {...props} />
    </ErrorBoundary>
);

export default ErrorBoundary;
